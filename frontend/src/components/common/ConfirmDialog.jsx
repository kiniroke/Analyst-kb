import Modal from "./Modal";
import Button from "./Button";

function ConfirmDialog({ isOpen, title = "Confirm action", description, onConfirm, onCancel }) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <p>{description}</p>
      <div className="row-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
