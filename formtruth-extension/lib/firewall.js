// Consistency Firewall page blocking. Extracted from popup.js (no behavior change).

'use strict';

/* ------------------------------------------------------------------ *
 * Consistency Firewall
 * ------------------------------------------------------------------ */

const FIREWALL_FIELDS = new Set([
  'name',
  'email',
  'phone',
  'date_of_birth',
]);

export function installFirewall(conflicts, tabId) {

  const seriousConflicts =
    conflicts.filter(
      (entry) =>
        FIREWALL_FIELDS.has(entry.field)
    );

  const payload =
    seriousConflicts.map(
      (entry) => ({
        field: entry.field,
        actual: entry.actual,
        expected: entry.expected,
      })
    );

  try {
    const pending =
      chrome.scripting.executeScript({
        target: {
          tabId:
            tabId,
          allFrames: true,
        },
        func: firewallPageScript,
        args: [payload],
      });

    if (
      pending &&
      pending.catch
    ) {
      pending.catch(
        () => {}
      );
    }
  } catch (err) {
    /* firewall installation may fail on restricted pages */
  }
}

export function firewallPageScript(conflicts) {
  const KEY =
    '__formtruth_firewall';

  if (!window[KEY]) {
    const state = {
      conflicts: [],
      allowOnce: false,
      pendingForm: null,
    };

    function removeModal() {
      const existing =
        document.getElementById(
          'formtruth-firewall-modal'
        );

      if (existing) {
        existing.remove();
      }
    }

    function createModal(event) {
      if (
        state.allowOnce ||
        !state.conflicts.length
      ) {
        state.allowOnce = false;
        return;
      }

      const form =
        event.target &&
        typeof event.target.closest ===
          'function'
          ? event.target.closest('form')
          : event.target;

      if (!form) {
        return;
      }

      state.pendingForm = form;

      event.preventDefault();
      event.stopImmediatePropagation();

      removeModal();

      const overlay =
        document.createElement('div');

      overlay.id =
        'formtruth-firewall-modal';

      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        background: rgba(8, 12, 20, 0.72);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family:
          Inter,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          Arial,
          sans-serif;
        box-sizing: border-box;
      `;

      const box =
        document.createElement('div');

      box.style.cssText = `
        width: min(560px, 100%);
        max-height: 85vh;
        overflow: auto;
        background: #111827;
        color: #f9fafb;
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 18px;
        padding: 24px;
        box-shadow:
          0 24px 80px rgba(0,0,0,0.45);
        box-sizing: border-box;
      `;

      const header =
        document.createElement('div');

      header.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 8px;
      `;

      const icon =
        document.createElement('div');

      icon.textContent = '!';

      icon.style.cssText = `
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: rgba(239,68,68,0.14);
        color: #f87171;
        border: 1px solid rgba(239,68,68,0.25);
        font-size: 22px;
        font-weight: 800;
        box-sizing: border-box;
      `;

      const headingWrap =
        document.createElement('div');

      const title =
        document.createElement('h2');

      title.textContent =
        'FormTruth blocked submission';

      title.style.cssText = `
        margin: 0;
        font-size: 21px;
        line-height: 1.25;
        font-weight: 750;
        letter-spacing: -0.02em;
      `;

      const badge =
        document.createElement('span');

      badge.textContent =
        'CONSISTENCY FIREWALL';

      badge.style.cssText = `
        display: inline-block;
        margin-top: 7px;
        padding: 4px 8px;
        border-radius: 999px;
        background: rgba(239,68,68,0.12);
        color: #fca5a5;
        border: 1px solid rgba(239,68,68,0.20);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
      `;

      headingWrap.append(
        title,
        badge
      );

      header.append(
        icon,
        headingWrap
      );

      box.appendChild(header);

      const message =
        document.createElement('p');

      message.textContent =
        'FormTruth found important fields that do not match your Truth Profile. The form was not submitted.';

      message.style.cssText = `
        margin: 16px 0 18px;
        color: #cbd5e1;
        font-size: 14px;
        line-height: 1.6;
      `;

      box.appendChild(message);

      const conflictList =
        document.createElement('div');

      conflictList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;

      state.conflicts.forEach(
        (conflict) => {
          const item =
            document.createElement('div');

          item.style.cssText = `
            padding: 14px;
            border-radius: 12px;
            background: #0f172a;
            border: 1px solid #263244;
            box-sizing: border-box;
          `;

          const field =
            document.createElement('div');

          field.textContent =
            conflict.field;

          field.style.cssText = `
            margin-bottom: 10px;
            color: #f8fafc;
            font-size: 13px;
            font-weight: 750;
          `;

          item.appendChild(field);

          const values =
            document.createElement('div');

          values.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          `;

          const formBox =
            document.createElement('div');

          formBox.style.cssText = `
            min-width: 0;
            padding: 10px;
            border-radius: 9px;
            background: rgba(239,68,68,0.08);
            border: 1px solid rgba(239,68,68,0.16);
          `;

          const formLabel =
            document.createElement('div');

          formLabel.textContent =
            'FORM';

          formLabel.style.cssText = `
            margin-bottom: 5px;
            color: #fca5a5;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.08em;
          `;

          const formValue =
            document.createElement('div');

          formValue.textContent =
            String(
              conflict.actual ?? ''
            );

          formValue.style.cssText = `
            overflow-wrap: anywhere;
            color: #f8fafc;
            font-size: 13px;
            line-height: 1.4;
          `;

          formBox.append(
            formLabel,
            formValue
          );

          const profileBox =
            document.createElement('div');

          profileBox.style.cssText = `
            min-width: 0;
            padding: 10px;
            border-radius: 9px;
            background: rgba(59,130,246,0.08);
            border: 1px solid rgba(59,130,246,0.16);
          `;

          const profileLabel =
            document.createElement('div');

          profileLabel.textContent =
            'TRUTH PROFILE';

          profileLabel.style.cssText = `
            margin-bottom: 5px;
            color: #93c5fd;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.08em;
          `;

          const profileValue =
            document.createElement('div');

          profileValue.textContent =
            String(
              conflict.expected ?? ''
            );

          profileValue.style.cssText = `
            overflow-wrap: anywhere;
            color: #f8fafc;
            font-size: 13px;
            line-height: 1.4;
          `;

          profileBox.append(
            profileLabel,
            profileValue
          );

          values.append(
            formBox,
            profileBox
          );

          item.appendChild(values);

          conflictList.appendChild(item);
        }
      );

      box.appendChild(conflictList);

      const actions =
        document.createElement('div');

      actions.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 22px;
        justify-content: flex-end;
        flex-wrap: wrap;
      `;

      const back =
        document.createElement('button');

      back.type = 'button';

      back.textContent =
        'Go back';

      back.style.cssText = `
        min-height: 42px;
        padding: 10px 17px;
        border: 1px solid #374151;
        border-radius: 10px;
        background: #1f2937;
        color: #f9fafb;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      `;

      back.addEventListener(
        'click',
        () => {
          state.pendingForm = null;
          removeModal();
        }
      );

      const submit =
        document.createElement('button');

      submit.type = 'button';

      submit.textContent =
        'Submit anyway';

      submit.style.cssText = `
        min-height: 42px;
        padding: 10px 17px;
        border: 1px solid rgba(239,68,68,0.35);
        border-radius: 10px;
        background: #b91c1c;
        color: #ffffff;
        font: inherit;
        font-size: 13px;
        font-weight: 750;
        cursor: pointer;
      `;

      submit.addEventListener(
        'click',
        () => {
          const pendingForm =
            state.pendingForm;

          if (!pendingForm) {
            removeModal();
            return;
          }

          state.allowOnce = true;
          state.pendingForm = null;

          removeModal();

          if (
            typeof pendingForm.requestSubmit ===
            'function'
          ) {
            pendingForm.requestSubmit();
          } else if (
            typeof pendingForm.submit ===
            'function'
          ) {
            pendingForm.submit();
          }
        }
      );

      actions.append(
        back,
        submit
      );

      box.appendChild(actions);

      const footer =
        document.createElement('div');

      footer.textContent =
        'FormTruth runs locally. Your form data is not sent to FormTruth.';

      footer.style.cssText = `
        margin-top: 16px;
        padding-top: 14px;
        border-top: 1px solid rgba(255,255,255,0.08);
        color: #64748b;
        font-size: 11px;
        line-height: 1.5;
        text-align: center;
      `;

      box.appendChild(footer);

      overlay.appendChild(box);

      document.body.appendChild(
        overlay
      );
    }

    document.addEventListener(
      'submit',
      createModal,
      true
    );

    document.addEventListener(
      'click',
      (event) => {
        if (
          state.allowOnce ||
          !state.conflicts.length
        ) {
          return;
        }

        const target =
          event.target;

        if (
          !target ||
          typeof target.closest !==
            'function'
        ) {
          return;
        }

        const button =
          target.closest(
            'button, input[type="submit"], input[type="image"]'
          );

        if (!button) {
          return;
        }

        const form =
          button.form ||
          button.closest('form');

        if (!form) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        createModal({
          target: form,
          preventDefault() {},
          stopImmediatePropagation() {},
        });
      },
      true
    );

    window[KEY] = state;
  }

  window[KEY].conflicts =
    conflicts || [];
}

