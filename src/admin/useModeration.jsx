import { useState } from 'react';
import ConfirmDialog from '../components/modals/ConfirmDialog.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { DisableDialog } from './dialogs.jsx';
import { adminApi } from '../lib/adminApi.js';

/**
 * Shared Disable / Enable / Delete handlers + their dialogs.
 * @param {() => void} onChange called after any successful mutation (reload list)
 */
export function useModeration(onChange) {
  const toast = useToast();
  const [disableT, setDisableT] = useState(null);
  const [deleteT,  setDeleteT]  = useState(null);

  const onEnable = async (doc) => {
    try {
      await adminApi.enableUrl(doc.shortId);
      toast(`${doc.shortId} enabled`);
      onChange?.();
    } catch (e) {
      toast(e.message || 'Could not enable link', 'err');
    }
  };

  const confirmDisable = async (reason) => {
    await adminApi.disableUrl(disableT.shortId, reason); // ConfirmDialog/DisableDialog surfaces throws
    toast(`${disableT.shortId} paused`);
    setDisableT(null);
    onChange?.();
  };

  const confirmDelete = async () => {
    await adminApi.deleteUrl(deleteT.shortId);
    toast(`${deleteT.shortId} deleted`);
    setDeleteT(null);
    onChange?.();
  };

  const dialogs = (
    <>
      {disableT && (
        <DisableDialog shortId={disableT.shortId} onConfirm={confirmDisable} onClose={() => setDisableT(null)} />
      )}
      {deleteT && (
        <ConfirmDialog
          title="Delete this link?"
          body={`${deleteT.shortId} will be permanently removed. This can't be undone.`}
          onConfirm={confirmDelete}
          onClose={() => setDeleteT(null)}
        />
      )}
    </>
  );

  return { onDisable: setDisableT, onEnable, onDelete: setDeleteT, dialogs };
}
