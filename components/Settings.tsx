import React, { useEffect, useState } from 'react';
import type { NotificationSettings } from '../types';
import { NotificationMethod } from '../types';

interface SettingsProps {
    settings: NotificationSettings;
    setSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
}

const ToggleOption: React.FC<{ title: string; description: string; enabled: boolean; onToggle: (enabled: boolean) => void; }> = ({ title, description, enabled, onToggle }) => {
    return (
        <div className="py-5 sm:flex sm:items-center sm:justify-between border-b border-gray-200 last:border-b-0">
            <div>
                <h4 className="text-base font-semibold leading-6 text-gray-900">{title}</h4>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4">
                <button
                    type="button"
                    onClick={() => onToggle(!enabled)}
                    className={`${enabled ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                    role="switch"
                    aria-checked={enabled}
                >
                    <span
                        aria-hidden="true"
                        className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                </button>
            </div>
        </div>
    );
};

const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
    // Section Profil
    const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
    const [showConfirm, setShowConfirm] = useState(false);
    useEffect(() => {
        localStorage.setItem('userName', userName);
        if (userName.trim()) {
            setShowConfirm(true);
            const timer = setTimeout(() => setShowConfirm(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [userName]);
    // Version de l'app
    const [version, setVersion] = useState<string>('');
    useEffect(() => {
        try {
            let v = '';
            if (window?.require && window.require('electron')?.remote?.app) {
                v = window.require('electron').remote.app.getVersion();
            }
            if (!v) {
                // En mode dev, lit la version et la date du package.json
                fetch('package.json')
                  .then(res => res.json())
                  .then(pkg => {
                    setVersion(pkg.version);
                    setBuildDate(pkg.buildDate || '');
                  })
                  .catch(() => setVersion(''));
            } else {
                setVersion(v);
            }
        } catch {}
    }, []);

    // Date de build
    const [buildDate, setBuildDate] = useState<string>('');

    // Option mise à jour auto
    const [autoUpdate, setAutoUpdate] = useState<boolean>(true);
    useEffect(() => {
        const pref = localStorage.getItem('autoUpdate');
        if (pref !== null) setAutoUpdate(pref === 'true');
    }, []);
    const handleToggleAutoUpdate = (enabled: boolean) => {
        setAutoUpdate(enabled);
        localStorage.setItem('autoUpdate', String(enabled));
    };
        // Pour le guidage visuel de l'assistant
        const steps = [
            { key: 'main', label: 'Accueil' },
            { key: 'restore', label: 'Restaurer' },
            { key: 'export', label: 'Exporter' },
            { key: 'import', label: 'Importer' },
            { key: 'advanced', label: 'Avancé' }
        ];
    // Backup management
    const [backupLocation, setBackupLocation] = React.useState<string | null>(null);
    const [backups, setBackups] = React.useState<Array<{ filename: string; date: string; type: string; path: string }> | null>(null);
    const [selectedBackup, setSelectedBackup] = React.useState<string | null>(null);
    // Assistant pas-à-pas
    const [step, setStep] = React.useState<'main' | 'restore' | 'import' | 'export' | 'advanced'>('main');
    // Recharge la liste des sauvegardes à chaque ouverture de l'étape 'restore'
    React.useEffect(() => {
        if (step === 'restore') {
            handleListBackups();
        }
    }, [step]);
    // Export manuel
    const handleExport = async () => {
        setIsLoading(true);
        // ...logique d'export...
    };

    // Import manuel
    const handleImport = async () => {
        setIsLoading(true);
        try {
            const imported = await window.api.importData();
            if (imported) {
                if (window.__APP_RESTORE__) {
                    window.__APP_RESTORE__(imported);
                    setToast({ type: 'success', message: 'Import JSON effectué avec succès !' });
                } else {
                    setToast({ type: 'error', message: 'Impossible de restaurer les données importées.' });
                }
            } else {
                setToast({ type: 'error', message: 'Aucune donnée importée.' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Erreur lors de l’import.' });
        } finally {
            setIsLoading(false);
        }
    };

  const handleToggleChange = (key: keyof NotificationSettings) => (enabled: boolean) => {
    setSettings(prev => ({ ...prev, [key]: enabled ? NotificationMethod.IN_APP : NotificationMethod.OFF }));
  };
    // Gestion d'état et notifications
    const [isLoading, setIsLoading] = React.useState(false);
    const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [toastHistory, setToastHistory] = React.useState<Array<{ type: 'success' | 'error'; message: string }>>([]);

    // Centraliser les notifications
    React.useEffect(() => {
        if (toast) setToastHistory(h => [toast, ...h.slice(0, 4)]);
    }, [toast]);

    // Choix de l'emplacement de sauvegarde
    const handleChooseBackupLocation = async () => {
        setIsLoading(true);
        try {
            const location = await window.api.chooseBackupLocation();
            if (location) {
                setBackupLocation(location);
                setToast({ type: 'success', message: 'Emplacement des backups défini !' });
            } else {
                setToast({ type: 'error', message: 'Aucun emplacement choisi.' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Erreur lors du choix de l’emplacement.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Liste des backups
    const handleListBackups = async () => {
        setIsLoading(true);
        try {
            const list = await window.api.listBackups();
            if (list && Array.isArray(list)) {
                setBackups(list.map(b => ({
                    filename: b.name,
                    date: typeof b.date === 'string' ? b.date : b.date.toLocaleString(),
                    type: b.name && b.name.includes('auto') ? 'auto' : 'manuel',
                    path: b.path
                })));
            } else {
                setBackups([]);
                setToast({ type: 'error', message: 'Aucun backup trouvé.' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Erreur lors de la récupération des backups.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Restauration depuis un backup sélectionné
    const handleRestoreBackup = async () => {
        if (!selectedBackup) {
            setToast({ type: 'error', message: 'Veuillez sélectionner un backup à restaurer.' });
            return;
        }
        setIsLoading(true);
        try {
            const restored = await window.api.restoreBackup(selectedBackup);
            if (restored) {
                if (window.__APP_RESTORE__) {
                    window.__APP_RESTORE__(restored);
                    setToast({ type: 'success', message: 'Backup restauré avec succès !' });
                } else {
                    setToast({ type: 'error', message: 'Impossible de restaurer les données du backup.' });
                }
            } else {
                setToast({ type: 'error', message: 'Aucune donnée restaurée.' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Erreur lors de la restauration du backup.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Charger la liste des backups au montage
    React.useEffect(() => {
        handleListBackups();
    }, []);

    // Fonctions de sauvegarde/restauration manuelle
    const handleManualSave = async () => {
        setIsLoading(true);
        try {
            if (window.__APP_STATE__) {
                await window.api.saveData(window.__APP_STATE__);
                if (window.api.saveBackup) {
                    await window.api.saveBackup(window.__APP_STATE__, 'manuel');
                }
                setToast({ type: 'success', message: 'Sauvegarde manuelle et backup effectués avec succès !' });
            } else {
                setToast({ type: 'error', message: 'Impossible d’accéder aux données à sauvegarder.' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Erreur lors de la sauvegarde.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualRestore = async () => {
        setIsLoading(true);
        try {
            const restored = await window.api.readData();
            if (restored) {
                if (window.__APP_RESTORE__) {
                    window.__APP_RESTORE__(restored);
                    setToast({ type: 'success', message: 'Données restaurées avec succès !' });
                } else {
                    setToast({ type: 'error', message: 'Impossible de restaurer les données dans l’application.' });
                }
            } else {
                setToast({ type: 'error', message: 'Aucune donnée à restaurer.' });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'Erreur lors de la restauration.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Paramètres</h2>
            <div className="max-w-4xl space-y-8">
                                {/* Clé API Gemini */}
                                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                                    <h3 className="text-xl font-bold mb-2 text-gray-800">Clé API Gemini (Google)</h3>
                                    <p className="text-sm text-gray-500 mb-2">Pour utiliser l’intelligence artificielle, vous devez obtenir une clé API Gemini gratuite sur le site de Google.<br/>Voici comment faire :<br/>1. Rendez-vous sur <a href='https://aistudio.google.com/app/apikey' target='_blank' rel='noopener noreferrer' className='text-indigo-600 underline'>aistudio.google.com/app/apikey</a><br/>2. Connectez-vous avec votre compte Google.<br/>3. Cliquez sur “Créer une clé API” et copiez la clé affichée.<br/>4. Collez-la ci-dessous.</p>
                                    <input
                                        id="gemini-api-key"
                                        type="text"
                                        value={settings.geminiApiKey || ''}
                                        onChange={e => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                                        className="border rounded px-3 py-2 w-full max-w-xs"
                                        placeholder="Collez votre clé API Gemini ici..."
                                    />
                                </div>
                {/* Section Profil */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Profil</h3>
                    <label htmlFor="userName" className="block mb-1 font-medium">Votre Prénom</label>
                    <input
                        id="userName"
                        type="text"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        className="border rounded px-3 py-2 w-full max-w-xs"
                        placeholder="Entrez votre prénom"
                    />
                    {showConfirm && (
                        <div className="mt-2 text-green-600 text-sm font-semibold">Prénom enregistré !</div>
                    )}
                </div>
                {/* Section IA */}
                {/* Notifications */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">Notifications</h3>
                    <p className="text-gray-500 mt-1 mb-2">Activez ou désactivez les alertes pour garder le contrôle de vos finances.</p>
                    <div className="divide-y divide-gray-200">
                        <ToggleOption 
                            title="Alertes de Solde Bas"
                            description="Recevoir une alerte quand le solde d'un compte est inférieur au seuil défini."
                            enabled={settings.lowBalance === NotificationMethod.IN_APP}
                            onToggle={handleToggleChange('lowBalance')}
                        />
                        <ToggleOption 
                            title="Rappels d'Échéances"
                            description="Recevoir une alerte à l'approche de la date d'une transaction récurrente."
                            enabled={settings.deadlines === NotificationMethod.IN_APP}
                            onToggle={handleToggleChange('deadlines')}
                        />
                        <ToggleOption 
                            title="Alertes de Budget"
                            description="Recevoir une alerte quand vous approchez ou dépassez un budget mensuel."
                            enabled={settings.budgets === NotificationMethod.IN_APP}
                            onToggle={handleToggleChange('budgets')}
                        />
                    </div>
                </div>
                {/* Gestion des Données - refonte simplifiée */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Gestion des Données</h3>
                    <div className="mb-2 text-sm text-gray-700">
                        <span>💡 Les sauvegardes automatiques sont activées : vos données sont enregistrées toutes les 5 minutes sans action de votre part.</span>
                    </div>
                    {/* Notifications centralisées */}
                    {toast && (
                        <div className={`mb-4 p-3 rounded-lg text-sm font-semibold ${toast.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{toast.message}</div>
                    )}
                    {toastHistory.length > 1 && (
                        <div className="mb-2 text-xs text-gray-500">Historique : {toastHistory.slice(1).map((t, i) => <span key={i} className={`mr-2 ${t.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{t.message}</span>)}</div>
                    )}
                    {/* Bouton Options avancées centré en bas */}
                    {/* Guidage visuel : barre d'étapes */}
                    <div className="flex items-center justify-center mb-6">
                        {steps.map((s, idx) => (
                            <div key={s.key} className="flex items-center">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-all duration-200
                                    ${step === s.key ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-gray-200 text-gray-500'}`}
                                    style={{ border: step === s.key ? '2px solid #6366f1' : '2px solid #e5e7eb' }}>
                                    {idx + 1}
                                </div>
                                <span className={`ml-2 mr-4 text-sm font-medium ${step === s.key ? 'text-indigo-700' : 'text-gray-400'}`}>{s.label}</span>
                                {idx < steps.length - 1 && <span className="mx-1 text-gray-300">→</span>}
                            </div>
                        ))}
                    </div>
                    {/* Assistant pas-à-pas et actions principales */}
                    {step === 'main' && (
                        <div>
                            <div className="flex flex-col gap-4">
                            <button
                                type="button"
                                onClick={() => { void handleManualSave(); }}
                                disabled={isLoading}
                                className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Sauvegarder maintenant
                                <span className="block text-xs font-normal mt-1">Enregistre vos données et crée une copie de sécurité (backup) automatiquement.</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('restore')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-lg transition-colors"
                            >
                                Restaurer une sauvegarde
                                <span className="block text-xs font-normal mt-1">Récupérez vos données à partir d’une sauvegarde précédente.</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('export')}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-5 rounded-lg transition-colors"
                            >
                                Exporter mes données
                                <span className="block text-xs font-normal mt-1">Téléchargez vos données au format JSON pour les conserver ou les transférer.</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('import')}
                                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-5 rounded-lg transition-colors"
                            >
                                Importer des données
                                <span className="block text-xs font-normal mt-1">Ajoutez des données à partir d’un fichier JSON existant.</span>
                            </button>
                            </div>
                            <div className="flex justify-center mt-8">
                                <button
                                    type="button"
                                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-2 px-6 rounded-lg shadow transition-colors"
                                    onClick={() => setStep('advanced')}
                                >
                                    Options avancées
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Assistant restauration backup */}
                    {step === 'restore' && (
                        <div className="flex flex-col gap-4">
        <div className="mb-2 text-sm text-gray-600">Retrouvez vos anciennes sauvegardes ci-dessous. Sélectionnez une sauvegarde puis cliquez sur « Restaurer la sélection » pour récupérer vos données.</div>
        <div className="flex flex-col gap-2">
            {backups && backups.length > 0 ? backups.map(b => (
                <div key={b.filename} className={`flex items-center justify-between border rounded px-3 py-2 bg-gray-50 ${selectedBackup === b.path ? 'border-indigo-500 bg-indigo-50' : ''}`}
                    onClick={() => setSelectedBackup(b.path)}
                    style={{ cursor: 'pointer' }}>
                    <div>
                        <span className="font-mono text-xs text-gray-700">{b.filename}</span>
                        <span className="ml-2 text-xs text-gray-500">{b.date.toLocaleString ? b.date.toLocaleString() : b.date} - {b.type || ''}</span>
                    </div>
                    {selectedBackup === b.path && (
                        <span className="ml-2 text-indigo-600 font-bold text-xs">Sélectionné</span>
                    )}
                </div>
            )) : (
                <div className="text-gray-400 text-sm">Aucun backup trouvé.</div>
            )}
        </div>
        <button
            type="button"
            onClick={handleRestoreBackup}
            disabled={!selectedBackup || isLoading}
            className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg transition-colors ${!selectedBackup || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            Restaurer la sélection
        </button>
        <button type="button" className="w-full bg-gray-200 text-gray-700 rounded-lg py-2 px-5 mt-2" onClick={() => setStep('main')}>Retour</button>
    </div>
                    )}
                    {/* Assistant export */}
                    {step === 'export' && (
                        <div className="flex flex-col gap-4">
                            <div className="mb-2 text-sm text-gray-600">Téléchargez vos données au format JSON pour les conserver ou les transférer vers un autre appareil.</div>
                            <button type="button" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-5 rounded-lg" onClick={handleExport}>Exporter maintenant</button>
                            <button type="button" className="w-full bg-gray-200 text-gray-700 rounded-lg py-2 px-5" onClick={() => setStep('main')}>Retour</button>
                        </div>
                    )}
                    {/* Assistant import */}
                    {step === 'import' && (
                        <div className="flex flex-col gap-4">
                            <div className="mb-2 text-sm text-gray-600">Ajoutez des données à partir d’un fichier JSON existant. Cette opération remplacera vos données actuelles.</div>
                            <button type="button" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-5 rounded-lg" onClick={handleImport}>Importer maintenant</button>
                            <button type="button" className="w-full bg-gray-200 text-gray-700 rounded-lg py-2 px-5" onClick={() => setStep('main')}>Retour</button>
                        </div>
                    )}
                    {/* Mode avancé */}
                    {step === 'advanced' && (
                        <div className="mt-6">
                            <h4 className="text-lg font-semibold mb-2">Options avancées</h4>
                            <div className="flex flex-col gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={handleChooseBackupLocation}
                                    disabled={isLoading}
                                    className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Choisir l’emplacement des sauvegardes
                                </button>
                                <button
                                    type="button"
                                    onClick={handleListBackups}
                                    disabled={isLoading}
                                    className={`w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Actualiser la liste des sauvegardes
                                </button>
                            </div>
                            <div className="mb-2 text-sm text-gray-600">
                                <span>Emplacement par défaut des sauvegardes&nbsp;: </span>
                                <span className="font-mono">{backupLocation || 'Documents/ComptesSurMoi_Backups'}</span>
                                <br />
                                <span className="text-xs text-gray-500">Vous pouvez le modifier à tout moment.</span>
                            </div>
                            <div className="flex justify-center mt-8">
                                <button
                                    type="button"
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg shadow transition-colors"
                                    onClick={() => setStep('main')}
                                >
                                    Retour
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {/* Affichage version et option mise à jour */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Version de l'application</h3>
                    <p className="text-gray-500 mt-1 mb-2">{version || '...'}</p>
                    {buildDate && <p className="text-xs text-gray-400 mb-2">Build&nbsp;: {buildDate}</p>}
                    <a
                        href="https://github.com/OptimaluS/Comptes-Sur-Moi/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline text-sm mb-2 block"
                    >Notes de version</a>
                    <ToggleOption
                        title="Mises à jour automatiques"
                        description="Activez ou désactivez la vérification et l'installation automatique des mises à jour."
                        enabled={autoUpdate}
                        onToggle={handleToggleAutoUpdate}
                    />
                </div>
                {/* Soutenir le projet */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">Soutenir le projet</h3>
                    <p className="text-gray-500 mt-1 mb-4">Comptes Sur Moi est une application gratuite développée par un passionné. Si cet outil vous est utile, vous pouvez m'aider à financer son développement futur en m'offrant un café !</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            type="button"
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            <span>💖</span>
                            Me Sponsoriser sur GitHub
                        </button>
                        <button 
                            type="button"
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold py-3 px-6 rounded-lg transition-colors"
                        >
                            <span>☕</span>
                            M'offrir un café
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    return (
        <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Paramètres</h2>
            <div className="max-w-4xl space-y-8">
                <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Profil</h3>
                    <label htmlFor="userName" className="block mb-1 font-medium">Votre Prénom</label>
                    <input
                        id="userName"
                        type="text"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        className="border rounded px-3 py-2 w-full max-w-xs"
                        placeholder="Entrez votre prénom"
                    />
                </section>
                {/* Section IA */}
                <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold mb-2 text-gray-800">IA</h3>
                        <label htmlFor="gemini-api-key" className="block mb-1 font-medium"></label>
                    <input
                        id="gemini-api-key"
                        type="text"
                        value={settings.geminiApiKey || ''}
                        onChange={e => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                        className="border rounded px-3 py-2 w-full max-w-xs"
                        placeholder="Collez votre clé API Gemini ici..."
                    />
                </section>
                {/* Les autres sections des paramètres */}
                {/* ...sections sauvegardes, version, etc. ... */}
            </div>
        </div>
    );
}

export default Settings;
