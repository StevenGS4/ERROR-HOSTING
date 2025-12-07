export function sendNoti(errorMessage, errorId, type, canal) {
  window.dispatchEvent(
    new CustomEvent("error-notification", {
      detail: {
        errorMessage,
        errorId,
        type,
        canal
      }
    })
  );
}
