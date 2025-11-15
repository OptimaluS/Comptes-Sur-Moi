
import React, { useState, useEffect } from 'react';
import type { Category } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Category, 'id' | 'budget'>) => void;
  categoryToEdit: Category | null;
  existingCategories: Category[];
}

const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-yellow-400', 'bg-lime-500', 'bg-green-500', 
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
    'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500', 'bg-gray-400'
];

const commonIcons = [
    '🛒', '🏠', '🚗', '🎬', '💊', '🧾', '🛍️', '💰',
    '🏦', '✈️', '🍽️', '🎁', '🎓', '💼', '🏥', '⛽',
    '👕', '📱', '💻', '🏋️', '☕', '🐕', '📈', '💡',
    '👪', '🎉', '📚', '🛠️', '🎨', '💖', '🌿', '👶'
];

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSave, categoryToEdit, existingCategories }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏷️');
  const [color, setColor] = useState('bg-gray-400');
  const [error, setError] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const isEditing = !!categoryToEdit;

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setIcon(categoryToEdit.icon);
        setColor(categoryToEdit.color);
      } else {
        setName('');
        setIcon('🏷️');
        setColor('bg-gray-400');
      }
      setError(null);
      setShowIconPicker(false);
    }
  }, [isOpen, categoryToEdit]);

  if (!isOpen) return null;

  const validate = () => {
    if (name.trim() === '') {
        setError("Le nom ne peut pas être vide.");
        return false;
    }
    const nameExists = existingCategories.some(
        cat => cat.name.toLowerCase() === name.trim().toLowerCase() && cat.id !== categoryToEdit?.id
    );
    if (nameExists) {
        setError("Une catégorie avec ce nom existe déjà.");
        return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
        return;
    }
    onSave({
      name: name.trim(),
      icon,
      color,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8" role="document">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex items-center gap-4">
            <div className="relative">
                <label className="block text-sm font-medium text-gray-600 mb-1 text-center">Icône</label>
                <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-16 h-12 bg-gray-100 border border-gray-300 rounded-lg text-3xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    aria-haspopup="true"
                    aria-expanded={showIconPicker}
                >
                    {icon}
                </button>
                {showIconPicker && (
                    <div className="absolute top-full mt-2 z-10 bg-white p-2 rounded-lg shadow-lg border border-gray-200 grid grid-cols-8 gap-1 w-96">
                        {commonIcons.map(i => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => { setIcon(i); setShowIconPicker(false); }}
                                className="w-10 h-10 rounded-md text-2xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                                aria-label={`Choisir l'icône ${i}`}
                            >
                                {i}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex-grow">
                <label htmlFor="category-name" className="block text-sm font-medium text-gray-600 mb-1">Nom de la catégorie</label>
                <input
                    id="category-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-12 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Couleur</label>
            <div className="grid grid-cols-9 gap-2">
                {colors.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${c} ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500' : ''}`} aria-label={`Choisir la couleur ${c}`}></button>
                ))}
            </div>
          </div>
           {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-lg transition-colors">Annuler</button>
            <button type="submit" className="bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;