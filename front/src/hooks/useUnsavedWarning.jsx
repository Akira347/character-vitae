// front/src/hooks/useUnsavedWarning.jsx
import { useEffect } from 'react';

/**
 * useUnsavedWarning
 * - écoute `beforeunload` pour prévenir lors d'un refresh / fermeture onglet
 * - écoute `popstate` (back/forward) et affiche confirm() si isDirty
 *
 * Remarque : pour les navigations programmatiques via react-router (navigate())
 * il est préférable d'appeler manuellement une confirmation via la fonction confirm() fournie
 * ou d'utiliser un wrapper autour de navigate. Ici on protège refresh/back.
 *
 * @param {boolean} isDirty
 * @param {string} message
 */
export default function useUnsavedWarning(isDirty, message = 'Vous avez des modifications non sauvegardées. Quitter sans sauvegarder ?') {
    useEffect(() => {
        const handler = (e) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = message;
            return message;
        };
        const onPop = (ev) => {
            if (!isDirty) return;
            const ok = window.confirm(message);
            if (!ok) {
                // prevent navigating back by pushing state again
                history.pushState(null, '', location.href);
            }
        };

        window.addEventListener('beforeunload', handler);
        window.addEventListener('popstate', onPop);

        return () => {
            window.removeEventListener('beforeunload', handler);
            window.removeEventListener('popstate', onPop);
        };
    }, [isDirty, message]);
}
