import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Account, Transaction, Category } from '../types';
import { GoogleGenAI, Chat, Modality, Type, GenerateContentResponse, LiveSession, LiveServerMessage, Blob, FunctionDeclaration } from '@google/genai';

interface ChatIAProps {
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    handleOpenTxModal: (data: { prefill: Partial<Transaction> }) => void;
}

interface Message {
    id: string;
    role: 'user' | 'ia';
    content: string;
}

// --- Fonctions utilitaires pour l'audio ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const ChatIA: React.FC<ChatIAProps> = ({ accounts, transactions, categories, handleOpenTxModal }) => {
    const [messages, setMessages] = useState<Message[]>([{ id: 'initial', role: 'ia', content: 'Bonjour ! Comment puis-je vous aider ? Posez-moi une question ou essayez de dicter une transaction.' }]);
    const [textInput, setTextInput] = useState('');
    const [isProcessingText, setIsProcessingText] = useState(false);
    const [voiceState, setVoiceState] = useState<'idle' | 'connecting' | 'recording' | 'error'>('idle');

    // --- Refs ---
    const chatRef = useRef<Chat | null>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    
    // --- Gemini Config ---
    const systemInstruction = `You are a personal finance assistant for the app "Comptes Sur Moi". Be friendly, helpful, and concise.
    Current date: ${new Date().toISOString().split('T')[0]}
    User accounts:
    ${accounts.map(a => `- ${a.name}: ${a.balanceHistory[0]?.amount.toFixed(2)}€`).join('\n')}
    Categories: ${categories.map(c => c.name).join(', ')}
    Recent transactions:
    ${transactions.slice(-5).map(t => `- ${new Date(t.date).toLocaleDateString('fr-FR')}: ${t.description} (${t.amount.toFixed(2)}€)`).join('\n')}
    
    When a user wants to add a transaction, call the 'addTransaction' function.
    - Infer the transaction type from the user's language. Words like "payé", "acheté", "dépensé" mean an EXPENSE, so the amount should be NEGATIVE. Words like "reçu", "salaire", "gagné" mean an INCOME, so the amount should be POSITIVE.
    - You can understand relative dates. For example, 'hier' is yesterday, 'aujourd'hui' is today. If no date is specified, use today's date.
    `;

    const addTransactionDeclaration: FunctionDeclaration = {
        name: 'addTransaction',
        parameters: {
            type: Type.OBJECT,
            description: "Crée une nouvelle transaction de dépense ou de revenu.",
            properties: {
                description: { type: Type.STRING, description: "Description de la transaction (ex: 'loyer', 'courses')." },
                amount: { type: Type.NUMBER, description: "Montant de la transaction. DOIT être un nombre NÉGATIF pour une dépense (ex: un paiement, un achat) et POSITIF pour un revenu (ex: salaire)." },
                date: { type: Type.STRING, description: "Date de la transaction au format YYYY-MM-DD. Si non fournie, utilise la date d'aujourd'hui. Peut être déduite de mots comme 'hier'." },
            },
            required: ['description', 'amount'],
        },
    };

    // --- Effects ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(scrollToBottom, [messages]);


    // --- Text Chat Logic ---
    const handleTextSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = textInput.trim();
        if (!query || isProcessingText || voiceState !== 'idle') return;

        setIsProcessingText(true);
        setTextInput('');
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: query }]);

        try {
            if (!chatRef.current) {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction,
                        tools: [{ functionDeclarations: [addTransactionDeclaration] }],
                    },
                });
            }

            const stream = await chatRef.current.sendMessageStream({ message: query });
            
            let iaResponseContent = '';
            const iaMessageId = crypto.randomUUID();
            setMessages(prev => [...prev, { id: iaMessageId, role: 'ia', content: '' }]);

            let functionCalls: any[] = [];
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    iaResponseContent += chunkText;
                    setMessages(prev => prev.map(m => m.id === iaMessageId ? { ...m, content: iaResponseContent } : m));
                }
                 if (chunk.functionCalls) {
                    functionCalls.push(...chunk.functionCalls);
                }
            }

            if (functionCalls.length > 0) {
                for (const fc of functionCalls) {
                    if (fc.name === 'addTransaction') {
                         const { description, amount, date } = fc.args as { description: string; amount: number; date?: string; };
                         handleOpenTxModal({ prefill: { description, amount, date: date ? new Date(`${date}T00:00:00`) : new Date() } });
                    }
                }
            }
        } catch (error) {
            console.error("Error sending text message:", error);
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ia', content: "Désolé, une erreur s'est produite." }]);
        } finally {
            setIsProcessingText(false);
        }
    };
    
    // --- Voice Chat Logic ---
    const stopVoice = useCallback(async () => {
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e);
            } finally {
                sessionPromiseRef.current = null;
            }
        }
        
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        inputAudioContextRef.current?.close().catch(e => console.error(e));
        outputAudioContextRef.current?.close().catch(e => console.error(e));
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();

        setVoiceState('idle');
    }, []);

    const handleToggleVoice = async () => {
        if (voiceState === 'recording' || voiceState === 'connecting') {
            await stopVoice();
            return;
        }

        setVoiceState('connecting');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction,
                    tools: [{ functionDeclarations: [addTransactionDeclaration] }],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                        setVoiceState('recording');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                         if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                             setMessages(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.role === 'user') {
                                    return [...prev.slice(0, -1), { ...last, content: last.content + text }];
                                }
                                return [...prev, { id: crypto.randomUUID(), role: 'user', content: text }];
                            });
                        }
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                             setMessages(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.role === 'ia') {
                                    return [...prev.slice(0, -1), { ...last, content: last.content + text }];
                                }
                                return [...prev, { id: crypto.randomUUID(), role: 'ia', content: text }];
                            });
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }

                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'addTransaction') {
                                    const { description, amount, date } = fc.args as { description: string; amount: number; date?: string; };
                                    handleOpenTxModal({ prefill: { description, amount, date: date ? new Date(`${date}T00:00:00`) : new Date() } });
                                    sessionPromiseRef.current?.then(session => session.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result: "ok, fenetre ouverte" } }
                                    }));
                                }
                            }
                        }
                        
                         if (message.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(s => s.stop());
                            audioSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e) => {
                        console.error('Live session error:', e);
                        setVoiceState('error');
                        stopVoice();
                    },
                    onclose: () => {
                       // Handled by stopVoice
                    },
                }
            });
        } catch (error) {
            console.error('Failed to start microphone:', error);
            setVoiceState('error');
        }
    };
    
    useEffect(() => () => { stopVoice(); }, [stopVoice]);
    
    const isInputDisabled = isProcessingText || voiceState !== 'idle';
    
    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Assistant IA</h2>
          <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'ia' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">IA</div>}
                        <div className={`p-3 rounded-xl max-w-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>{msg.content}</div>
                    </div>
                ))}
                {isProcessingText && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">IA</div><div className="p-3 rounded-xl max-w-lg bg-gray-100 text-gray-800"><span className="animate-pulse">...</span></div></div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
                <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder={voiceState === 'idle' ? 'Tapez votre message...' : 'Interaction vocale active...'}
                        disabled={isInputDisabled}
                        className="w-full bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <button type="button" onClick={handleToggleVoice} disabled={isProcessingText} className={`p-3 rounded-full text-white transition-colors flex-shrink-0 disabled:opacity-50 ${voiceState === 'recording' ? 'bg-red-600' : 'bg-indigo-600'}`}>
                        {voiceState === 'connecting' ? <SpinnerIcon /> : <MicIcon />}
                    </button>
                    <button type="submit" disabled={isInputDisabled || !textInput.trim()} className="p-3 rounded-full bg-indigo-600 text-white transition-colors disabled:opacity-50 flex-shrink-0">
                        <SendIcon />
                    </button>
                </form>
            </div>
          </div>
        </div>
      );
};

const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.75 6.75 0 11-13.5 0v-1.5a.75.75 0 01.75-.75z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>;
const SpinnerIcon = () => <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

export default ChatIA;
