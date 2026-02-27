(function() {
    const STORAGE_KEY = 'slack_custom_names_v7';
    const IDB_NAME = 'slactac_aliases_db';
    const IDB_STORE = 'aliases';
    const IDB_KEY = 'name-map';
    const DEFAULT_LOCALE = 'en-US';
    const MESSAGES = {
        'en-US': { existingName: 'Original name', aliasPlaceholder: 'Enter alias (leave empty to remove)', cancel: 'Cancel', save: 'Save', managerTitle: 'Custom Name Manager', noEntries: 'No saved entries.', edit: 'Edit', del: 'Delete', guide: '🎯 Click any channel or DM row (ESC: cancel)', buttonTitle: 'Rename (Click) / Manage (Right-click)' },
        'en-GB': { existingName: 'Original name', aliasPlaceholder: 'Enter alias (leave empty to remove)', cancel: 'Cancel', save: 'Save', managerTitle: 'Custom Name Manager', noEntries: 'No saved entries.', edit: 'Edit', del: 'Delete', guide: '🎯 Click any channel or DM row (ESC: cancel)', buttonTitle: 'Rename (Click) / Manage (Right-click)' },
        'de-DE': { existingName: 'Urspruenglicher Name', aliasPlaceholder: 'Alias eingeben (leer lassen zum Entfernen)', cancel: 'Abbrechen', save: 'Speichern', managerTitle: 'Benutzerdefinierte Namen verwalten', noEntries: 'Keine gespeicherten Eintraege.', edit: 'Bearbeiten', del: 'Loeschen', guide: '🎯 Klicke auf eine Kanal- oder DM-Zeile (ESC: Abbrechen)', buttonTitle: 'Umbenennen (Klick) / Verwalten (Rechtsklick)' },
        'es-ES': { existingName: 'Nombre original', aliasPlaceholder: 'Introduce un alias (deja vacio para eliminar)', cancel: 'Cancelar', save: 'Guardar', managerTitle: 'Gestionar nombres personalizados', noEntries: 'No hay elementos guardados.', edit: 'Editar', del: 'Eliminar', guide: '🎯 Haz clic en una fila de canal o MD (ESC: cancelar)', buttonTitle: 'Renombrar (clic) / Administrar (clic derecho)' },
        'es-419': { existingName: 'Nombre original', aliasPlaceholder: 'Ingresa un alias (dejalo vacio para eliminar)', cancel: 'Cancelar', save: 'Guardar', managerTitle: 'Administrar nombres personalizados', noEntries: 'No hay elementos guardados.', edit: 'Editar', del: 'Eliminar', guide: '🎯 Haz clic en una fila de canal o MD (ESC: cancelar)', buttonTitle: 'Renombrar (clic) / Administrar (clic derecho)' },
        'fr-FR': { existingName: "Nom d'origine", aliasPlaceholder: 'Saisissez un alias (laisser vide pour supprimer)', cancel: 'Annuler', save: 'Enregistrer', managerTitle: 'Gerer les noms personnalises', noEntries: 'Aucune entree enregistree.', edit: 'Modifier', del: 'Supprimer', guide: '🎯 Cliquez sur une ligne de canal ou MP (ESC : annuler)', buttonTitle: 'Renommer (clic) / Gerer (clic droit)' },
        'it-IT': { existingName: 'Nome originale', aliasPlaceholder: 'Inserisci un alias (lascia vuoto per rimuovere)', cancel: 'Annulla', save: 'Salva', managerTitle: 'Gestisci nomi personalizzati', noEntries: 'Nessun elemento salvato.', edit: 'Modifica', del: 'Elimina', guide: '🎯 Fai clic su una riga canale o MP (ESC: annulla)', buttonTitle: 'Rinomina (clic) / Gestisci (clic destro)' },
        'pt-BR': { existingName: 'Nome original', aliasPlaceholder: 'Digite um apelido (deixe vazio para remover)', cancel: 'Cancelar', save: 'Salvar', managerTitle: 'Gerenciar nomes personalizados', noEntries: 'Nenhum item salvo.', edit: 'Editar', del: 'Excluir', guide: '🎯 Clique em uma linha de canal ou DM (ESC: cancelar)', buttonTitle: 'Renomear (clique) / Gerenciar (clique direito)' },
        'ja-JP': { existingName: '元の名前', aliasPlaceholder: '別名を入力（空欄で削除）', cancel: 'キャンセル', save: '保存', managerTitle: 'カスタム名の管理', noEntries: '保存された項目はありません。', edit: '編集', del: '削除', guide: '🎯 チャンネルまたはDM行をクリック（ESC: キャンセル）', buttonTitle: '名前変更（クリック）/ 管理（右クリック）' },
        'zh-CN': { existingName: '原名称', aliasPlaceholder: '输入别名（留空则删除）', cancel: '取消', save: '保存', managerTitle: '管理自定义名称', noEntries: '没有已保存的条目。', edit: '编辑', del: '删除', guide: '🎯 点击任意频道或私信行（ESC：取消）', buttonTitle: '重命名（单击）/ 管理（右键）' },
        'zh-TW': { existingName: '原始名稱', aliasPlaceholder: '輸入別名（留空即刪除）', cancel: '取消', save: '儲存', managerTitle: '管理自訂名稱', noEntries: '沒有已儲存項目。', edit: '編輯', del: '刪除', guide: '🎯 點擊任一頻道或私訊列（ESC：取消）', buttonTitle: '重新命名（點擊）/ 管理（右鍵）' },
        'ko-KR': { existingName: '기존 이름', aliasPlaceholder: '새 별명 입력 (비우면 삭제)', cancel: '취소', save: '저장', managerTitle: '커스텀 이름 관리', noEntries: '저장된 항목이 없습니다.', edit: '수정', del: '삭제', guide: '🎯 채널/DM을 클릭하세요 (ESC: 취소)', buttonTitle: '이름 수정(클릭) / 관리(우클릭)' }
    };
    let isSelecting = false;
    let transformQueued = false;
    let storageReady = false;
    let storedNamesCache = {};
    let lastThemeSignature = '';

    const normalizeLocale = (value) => (value || '').toString().trim().replace('_', '-').toLowerCase();
    const resolveLocale = (value) => {
        const locale = normalizeLocale(value);
        if (!locale) return '';
        if (locale === 'en-gb') return 'en-GB';
        if (locale.startsWith('en')) return 'en-US';
        if (locale.startsWith('de')) return 'de-DE';
        if (locale.startsWith('es-419')) return 'es-419';
        if (locale.startsWith('es')) return 'es-ES';
        if (locale.startsWith('fr')) return 'fr-FR';
        if (locale.startsWith('it')) return 'it-IT';
        if (locale.startsWith('pt')) return 'pt-BR';
        if (locale.startsWith('ja')) return 'ja-JP';
        if (locale.startsWith('ko')) return 'ko-KR';
        if (locale.startsWith('zh-hant') || locale.startsWith('zh-tw') || locale.startsWith('zh-hk') || locale.startsWith('zh-mo')) return 'zh-TW';
        if (locale.startsWith('zh')) return 'zh-CN';
        return '';
    };
    const detectSlackLocale = () => {
        const candidates = [];
        try {
            candidates.push(localStorage.getItem('i18nextLng'));
            candidates.push(localStorage.getItem('locale'));
            candidates.push(localStorage.getItem('slack-locale'));
        } catch (err) {
            console.warn('Locale lookup from localStorage failed:', err);
        }
        candidates.push(document.documentElement ? document.documentElement.lang : '');
        if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);
        candidates.push(navigator.language);
        for (const candidate of candidates) {
            if (!candidate) continue;
            const resolved = resolveLocale(candidate);
            if (resolved && MESSAGES[resolved]) return resolved;
        }
        return DEFAULT_LOCALE;
    };
    let activeLocale = detectSlackLocale();
    const t = (key) => (MESSAGES[activeLocale] && MESSAGES[activeLocale][key]) || MESSAGES[DEFAULT_LOCALE][key] || key;
    const refreshLocale = () => {
        const next = detectSlackLocale();
        if (!next || next === activeLocale) return false;
        activeLocale = next;
        return true;
    };

    const getStoredNames = () => storedNamesCache;
    const readLocalNames = () => {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (err) {
            console.error('Failed to parse local aliases:', err);
            return {};
        }
    };
    const writeLocalNames = (data) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            console.error('Failed to write local aliases:', err);
        }
    };
    const openAliasDB = () => new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('IndexedDB unavailable'));
            return;
        }

        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
    });
    const readFromIndexedDB = async () => {
        try {
            const db = await openAliasDB();
            const data = await new Promise((resolve, reject) => {
                const tx = db.transaction(IDB_STORE, 'readonly');
                const store = tx.objectStore(IDB_STORE);
                const getReq = store.get(IDB_KEY);
                getReq.onsuccess = () => resolve(getReq.result === undefined ? null : getReq.result);
                getReq.onerror = () => reject(getReq.error || new Error('IndexedDB read failed'));
            });
            db.close();
            if (data && typeof data === 'object') return data;
            return data === null ? null : {};
        } catch (err) {
            console.error('IndexedDB read failed:', err);
            return null;
        }
    };
    const writeToIndexedDB = async (data) => {
        try {
            const db = await openAliasDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(IDB_STORE, 'readwrite');
                const store = tx.objectStore(IDB_STORE);
                store.put(data, IDB_KEY);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
                tx.onabort = () => reject(tx.error || new Error('IndexedDB write aborted'));
            });
            db.close();
        } catch (err) {
            console.error('IndexedDB write failed:', err);
        }
    };
    const enablePersistentStorage = async () => {
        try {
            if (!navigator.storage || !navigator.storage.persisted || !navigator.storage.persist) {
                return false;
            }

            const alreadyPersisted = await navigator.storage.persisted();
            if (alreadyPersisted) return true;

            const granted = await navigator.storage.persist();
            const usage = navigator.storage.estimate ? await navigator.storage.estimate() : null;
            if (usage) {
                console.info('Storage estimate:', {
                    usage: usage.usage || 0,
                    quota: usage.quota || 0
                });
            }
            console.info('Persistent storage granted:', granted);
            return granted;
        } catch (err) {
            console.error('Persistent storage request failed:', err);
            return false;
        }
    };
    const loadNames = async () => {
        let nextData = readLocalNames();
        const idbData = await readFromIndexedDB();

        if (idbData !== null) {
            nextData = idbData;
        } else if (Object.keys(nextData).length > 0) {
            await writeToIndexedDB(nextData);
        }

        storedNamesCache = nextData;
        writeLocalNames(nextData);
        storageReady = true;
    };
    const saveNames = async (data) => {
        storedNamesCache = { ...data };
        writeLocalNames(storedNamesCache);
        await writeToIndexedDB(storedNamesCache);
    };
    const MODAL_ID = 'slactac-alias-modal';
    const GUIDE_ID = 'slack-selector-guide';
    const MGR_ID = 'slack-alias-mgr';
    const MGR_STYLE_ID = 'slactac-manager-style';
    const SELECT_HOVER_CLASS = 'slactac-selector-hover';
    const SELECT_MODE_CLASS = 'slactac-select-mode';
    const SELECTOR_STYLE_ID = 'slactac-selector-style';
    const TOP_TOOLTIP_ID = 'slactac-top-tooltip';

    const ensureSelectorStyles = () => {
        if (document.getElementById(SELECTOR_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = SELECTOR_STYLE_ID;
        style.textContent = `
            .${SELECT_MODE_CLASS} * {
                pointer-events: none !important;
            }
            .${SELECT_MODE_CLASS} #${GUIDE_ID} {
                pointer-events: none !important;
            }
            /* Re-enable only real conversation rows (channel/DM), keep everything else non-interactive. */
            .${SELECT_MODE_CLASS} .p-channel_sidebar__channel[data-qa-channel-sidebar-channel="true"],
            .${SELECT_MODE_CLASS} .p-channel_sidebar__channel[data-qa-channel-sidebar-channel="true"] * {
                pointer-events: auto !important;
            }
            .${SELECT_MODE_CLASS} .p-channel_sidebar__static_list__item:hover,
            .${SELECT_MODE_CLASS} .p-channel_sidebar__static_list__item__row_container:hover,
            .${SELECT_MODE_CLASS} [data-qa="virtual-list-item"]:hover {
                background: transparent !important;
                box-shadow: none !important;
            }
            .${SELECT_MODE_CLASS} .p-channel_sidebar__channel:hover,
            .${SELECT_MODE_CLASS} .c-sidebar_menu_item:hover,
            .${SELECT_MODE_CLASS} .p-ia4_sidebar_list__item:hover,
            .${SELECT_MODE_CLASS} [data-testid="sidebar-item"]:hover {
                background: transparent !important;
                box-shadow: none !important;
            }
            .${SELECT_MODE_CLASS} .p-channel_sidebar__static_list__item:hover::before,
            .${SELECT_MODE_CLASS} .p-channel_sidebar__static_list__item:hover::after,
            .${SELECT_MODE_CLASS} [data-qa="virtual-list-item"]:hover::before,
            .${SELECT_MODE_CLASS} [data-qa="virtual-list-item"]:hover::after,
            .${SELECT_MODE_CLASS} .p-channel_sidebar__channel:hover::before,
            .${SELECT_MODE_CLASS} .p-channel_sidebar__channel:hover::after {
                background: transparent !important;
                box-shadow: none !important;
                opacity: 0 !important;
            }
            .${SELECT_MODE_CLASS} .p-channel_sidebar__channel:hover *,
            .${SELECT_MODE_CLASS} .c-sidebar_menu_item:hover *,
            .${SELECT_MODE_CLASS} .p-ia4_sidebar_list__item:hover *,
            .${SELECT_MODE_CLASS} [data-testid="sidebar-item"]:hover * {
                background: transparent !important;
            }
            .${SELECT_HOVER_CLASS},
            .${SELECT_MODE_CLASS} .${SELECT_HOVER_CLASS},
            .${SELECT_MODE_CLASS} .${SELECT_HOVER_CLASS}:hover,
            .${SELECT_MODE_CLASS} [data-qa="virtual-list-item"].${SELECT_HOVER_CLASS},
            .${SELECT_MODE_CLASS} [data-qa="virtual-list-item"].${SELECT_HOVER_CLASS}:hover,
            .${SELECT_MODE_CLASS} .p-channel_sidebar__channel.${SELECT_HOVER_CLASS},
            .${SELECT_MODE_CLASS} .p-channel_sidebar__channel.${SELECT_HOVER_CLASS}:hover {
                background: var(--dt_color-theme-surf-inv-ter) !important;
                transition: outline-color 120ms ease, background-color 120ms ease;
                color: var(--dt_color-theme-content-inv-pry) !important;
            }
            .${SELECT_MODE_CLASS} .${SELECT_HOVER_CLASS} *,
            .${SELECT_MODE_CLASS} .${SELECT_HOVER_CLASS}:hover *,
            .${SELECT_MODE_CLASS} .p-channel_sidebar__channel.${SELECT_HOVER_CLASS} *,
            .${SELECT_MODE_CLASS} .p-channel_sidebar__channel.${SELECT_HOVER_CLASS}:hover * {
                color: var(--dt_color-theme-content-inv-pry) !important;
            }
            .${SELECT_MODE_CLASS} .${SELECT_HOVER_CLASS} svg,
            .${SELECT_MODE_CLASS} .${SELECT_HOVER_CLASS}:hover svg,
            .${SELECT_MODE_CLASS} .${SELECT_HOVER_CLASS} path,
            .${SELECT_MODE_CLASS} .${SELECT_HOVER_CLASS}:hover path {
                color: var(--dt_color-theme-content-inv-pry) !important;
                fill: currentColor !important;
            }
        `;
        document.head.appendChild(style);
    };
    const ensureManagerStyles = () => {
        if (document.getElementById(MGR_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = MGR_STYLE_ID;
        style.textContent = `
            #${MGR_ID} #mgr-list-container {
                scrollbar-width: thin;
                scrollbar-color: var(--slactac-scroll-thumb) var(--slactac-scroll-track);
            }
            #${MGR_ID} #mgr-list-container::-webkit-scrollbar {
                width: 10px;
            }
            #${MGR_ID} #mgr-list-container::-webkit-scrollbar-track {
                background: var(--slactac-scroll-track);
                border-radius: 999px;
            }
            #${MGR_ID} #mgr-list-container::-webkit-scrollbar-thumb {
                background: var(--slactac-scroll-thumb);
                border: none;
                border-radius: 999px;
            }
            #${MGR_ID} #mgr-list-container::-webkit-scrollbar-thumb:hover {
                background: var(--slactac-scroll-thumb-hover);
            }
            #${MGR_ID} .slactac-mgr-btn-close:hover {
                filter: brightness(1.08);
            }
            #${MGR_ID} .slactac-mgr-btn-edit {
                background: var(--slactac-btn-edit-bg);
                color: var(--slactac-btn-edit-fg);
                border: none;
            }
            #${MGR_ID} .slactac-mgr-btn-edit:hover {
                background: var(--slactac-btn-edit-hover);
            }
            #${MGR_ID} .slactac-mgr-btn-delete {
                background: var(--slactac-btn-del-bg);
                color: var(--slactac-btn-del-fg);
                border: none;
            }
            #${MGR_ID} .slactac-mgr-btn-delete:hover {
                background: var(--slactac-btn-del-hover);
            }
        `;
        document.head.appendChild(style);
    };
    const pickFromElement = (selectors, prop) => {
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (!el) continue;
            const value = getComputedStyle(el)[prop];
            if (value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') return value;
        }
        return '';
    };
    const getManagerTheme = () => {
        return {
            panelBg: pickFromElement(['.p-theme_background'], 'background'),
            panelText: 'rgba(var(--dt_color-plt-flamingo-100), 1)',
            titleText: 'var(--dt_color-theme-content-inv-pry)',
            aliasCountText: 'var(--dt_color-theme-content-inv-pry)',
            subtleText: 'rgba(var(--dt_color-plt-flamingo-100), 0.8)',
            cardBg: 'rgba(255,255,255,0.8)',
            scrollTrack: 'rgba(0,0,0,0.14)',
            scrollThumb: 'rgba(255,255,255,0.42)',
            scrollThumbHover: 'rgba(255,255,255,0.58)',
            closeBg: 'var(--dt_color-theme-surf-inv-pry)',
            editBtnBg: 'var(--dt_color-theme-base-hgl-1)',
            editBtnFg: 'var(--dt_color-theme-content-hgl-1)',
            editBtnBgHover: 'var(--dt_color-theme-base-hgl-1-hover)',
            delBtnBg: 'var(--dt_color-theme-base-imp)',
            delBtnBgHover: 'var(--dt_color-theme-base-imp-hover)',
            delBtnFg: 'var(--dt_color-theme-content-imp)'
        };
    };
    const themeSignature = (theme) => [
        theme.panelBg,
        theme.panelText,
        theme.subtleText,
        theme.cardBg,
        theme.scrollTrack,
        theme.scrollThumb,
        theme.scrollThumbHover,
        theme.closeBg,
        theme.editBtnBg,
        theme.editBtnBgHover,
        theme.editBtnFg,
        theme.delBtnBg,
        theme.delBtnBgHover,
        theme.delBtnFg
    ].join('|');

    const isEditableSidebarRow = (channelNode) => {
        if (!channelNode) return false;
        if (channelNode.getAttribute('data-qa-channel-sidebar-channel') !== 'true') return false;

        const type = (channelNode.getAttribute('data-qa-channel-sidebar-channel-type') || '').toLowerCase();
        // Allow only real channel/DM conversation rows.
        if (!['channel', 'public', 'private', 'private_channel', 'im', 'mpim'].includes(type)) return false;

        const hasName = !!channelNode.querySelector('.p-channel_sidebar__name, [data-qa^="channel_sidebar_name_"], [data-qa="channel_sidebar_name"]');
        return hasName;
    };
    const resolveSelectionTarget = (targetNode) => {
        const channelNode = targetNode.closest('.p-channel_sidebar__channel');
        if (!isEditableSidebarRow(channelNode)) return null;

        const rowCandidate = channelNode.closest('[data-qa="virtual-list-item"], [data-testid="sidebar-item"], .p-channel_sidebar__static_list__item') || channelNode;
        const textElement = channelNode.querySelector('.p-channel_sidebar__name, [data-qa^="channel_sidebar_name_"], [data-qa="channel_sidebar_name"]');
        if (!textElement) return null;

        const oldName = textElement.getAttribute('data-original-name') || textElement.textContent.replace('#', '').trim();
        if (!oldName) return null;
        return {
            rowCandidate,
            textElement,
            oldName
        };
    };

    // 1. Name replacement logic (targets the exact text nodes)
    const applyTransformations = () => {
        if (!storageReady) return;
        const names = getStoredNames();
        // Target leaf elements that actually contain visible names.
        const selectors = '.p-channel_sidebar__name, .c-sidebar_menu_item__label, .p-view_header__channel_title, .c-message__sender_link';
        
        document.querySelectorAll(selectors).forEach(el => {
            let original = el.getAttribute('data-original-name');
            if (!original) {
                original = el.textContent.replace('#', '').trim();
                if (original.length > 0) el.setAttribute('data-original-name', original);
            }

            const currentOriginal = el.getAttribute('data-original-name');
            if (names[currentOriginal]) {
                const newName = names[currentOriginal];
                const prefix = el.textContent.startsWith('#') ? '#' : '';
                if (el.textContent !== prefix + newName) el.textContent = prefix + newName;
            } else if (original) {
                const prefix = el.textContent.startsWith('#') ? '#' : '';
                if (el.textContent !== prefix + original) el.textContent = prefix + original;
            }
        });
    };

    const queueTransformations = () => {
        if (transformQueued) return;
        transformQueued = true;
        requestAnimationFrame(() => {
            transformQueued = false;
            applyTransformations();
        });
    };

    const showAliasModal = (oldName, initialValue) => new Promise((resolve) => {
        const existing = document.getElementById(MODAL_ID);
        if (existing) existing.remove();
        const theme = getManagerTheme();

        const overlay = document.createElement('div');
        overlay.id = MODAL_ID;
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:30000; display:flex; align-items:center; justify-content:center;';

        const modal = document.createElement('div');
        modal.style.cssText = `
            width:min(92vw,420px);
            background:${theme.panelBg};
            color:${theme.panelText};
            border:none;
            border-radius:14px;
            padding:14px;
            box-shadow:0 20px 42px rgba(0,0,0,0.45);
            font-family:Slack-Lato, Lato, "Helvetica Neue", sans-serif;
            backdrop-filter:blur(8px);
        `;
        modal.innerHTML = `
            <div style="margin-bottom:10px; padding:2px 2px 10px;">
                <div class="slactac-i18n-existing-name" style="font-size:12px; color:${theme.subtleText}; margin-bottom:4px;">${t('existingName')}</div>
                <div style="font-weight:700; color:${theme.titleText}; word-break:break-all;">${oldName}</div>
            </div>
            <input id="slactac-alias-input" type="text" style="width:100%; box-sizing:border-box; background:${theme.cardBg}; color:${theme.panelText}; border:none; border-radius:8px; padding:10px 12px; outline:none;" placeholder="${t('aliasPlaceholder')}" />
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
                <button id="slactac-alias-cancel" type="button" style="background:${theme.closeBg}; color:${theme.panelText}; border:none; border-radius:8px; padding:8px 12px; cursor:pointer; font-weight:700;">${t('cancel')}</button>
                <button id="slactac-alias-save" type="button" style="background:${theme.editBtnBg}; color:${theme.editBtnFg}; border:none; border-radius:8px; padding:8px 12px; cursor:pointer; font-weight:700;">${t('save')}</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const input = modal.querySelector('#slactac-alias-input');
        const cancelBtn = modal.querySelector('#slactac-alias-cancel');
        const saveBtn = modal.querySelector('#slactac-alias-save');
        input.value = initialValue || '';

        const close = (value) => {
            document.removeEventListener('keydown', onKeyDown, true);
            overlay.remove();
            resolve(value);
        };

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close(null);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                close(input.value);
            }
        };

        document.addEventListener('keydown', onKeyDown, true);
        cancelBtn.onclick = () => close(null);
        saveBtn.onclick = () => close(input.value);
        overlay.onclick = (e) => {
            if (e.target === overlay) close(null);
        };

        setTimeout(() => {
            input.focus();
            input.select();
        }, 0);
    });

    const removeTopButtonTooltip = () => {
        const tooltip = document.getElementById(TOP_TOOLTIP_ID);
        if (tooltip) tooltip.remove();
    };
    const showTopButtonTooltip = (button) => {
        removeTopButtonTooltip();
        if (!button) return;
        const text = t('buttonTitle');
        if (!text) return;

        const rect = button.getBoundingClientRect();
        const tooltip = document.createElement('div');
        tooltip.id = TOP_TOOLTIP_ID;
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: fixed;
            left: ${Math.round(rect.left + (rect.width / 2))}px;
            top: ${Math.round(rect.bottom + 8)}px;
            transform: translateX(-50%);
            background: rgba(29, 28, 29, 0.96);
            color: #ffffff;
            border-radius: 8px;
            padding: 6px 8px;
            font-size: 12px;
            line-height: 1.2;
            white-space: nowrap;
            z-index: 32000;
            pointer-events: none;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
        `;
        document.body.appendChild(tooltip);
    };
    const bindTopButtonTooltip = (button) => {
        if (!button || button.dataset.slactacTooltipBound === '1') return;
        const show = () => showTopButtonTooltip(button);
        const hide = () => removeTopButtonTooltip();
        button.addEventListener('mouseenter', show);
        button.addEventListener('mouseleave', hide);
        button.addEventListener('focus', show);
        button.addEventListener('blur', hide);
        button.dataset.slactacTooltipBound = '1';
    };

    const updateLocalizedUI = () => {
        const guide = document.getElementById(GUIDE_ID);
        if (guide) guide.innerHTML = t('guide');

        const topButton = document.querySelector('#slactac-toggle-btn button');
        if (topButton) {
            topButton.setAttribute('aria-label', t('buttonTitle'));
            topButton.removeAttribute('title');
            bindTopButtonTooltip(topButton);
        }
        const topButtonTooltip = document.querySelector('#slactac-toggle-btn [data-sk="tooltip"]');
        if (topButtonTooltip) topButtonTooltip.textContent = t('buttonTitle');
        removeTopButtonTooltip();

        const modal = document.getElementById(MODAL_ID);
        if (modal) {
            const label = modal.querySelector('.slactac-i18n-existing-name');
            if (label) label.textContent = t('existingName');
            const input = modal.querySelector('#slactac-alias-input');
            if (input) input.setAttribute('placeholder', t('aliasPlaceholder'));
            const cancel = modal.querySelector('#slactac-alias-cancel');
            if (cancel) cancel.textContent = t('cancel');
            const save = modal.querySelector('#slactac-alias-save');
            if (save) save.textContent = t('save');
        }

        const mgr = document.getElementById(MGR_ID);
        if (mgr) {
            const title = mgr.querySelector('.slactac-i18n-manager-title');
            if (title) title.textContent = t('managerTitle');
            mgr.querySelectorAll('[data-slactac-role="edit"]').forEach((el) => {
                el.textContent = t('edit');
            });
            mgr.querySelectorAll('[data-slactac-role="delete"]').forEach((el) => {
                el.textContent = t('del');
            });
            const noEntries = mgr.querySelector('.slactac-i18n-no-entries');
            if (noEntries) noEntries.textContent = t('noEntries');
        }
    };

    // 2. Management panel (edit/delete)
    const showManager = () => {
        const existing = document.getElementById(MGR_ID);
        if (existing) existing.remove();
        ensureManagerStyles();
        const theme = getManagerTheme();
        lastThemeSignature = themeSignature(theme);

        const data = getStoredNames();
        const mgr = document.createElement('div');
        mgr.id = MGR_ID;
        mgr.style.cssText = `
            position: fixed; top: 74px; right: 28px; width: min(92vw, 380px); max-height: 72vh;
            background: ${theme.panelBg}; color: ${theme.panelText}; border: none;
            border-radius: 14px; padding: 14px; z-index: 10000;
            box-shadow: 0 20px 42px rgba(0,0,0,0.45); font-family: Slack-Lato, Lato, "Helvetica Neue", sans-serif;
            backdrop-filter: blur(8px);
            --slactac-scroll-track: ${theme.scrollTrack};
            --slactac-scroll-thumb: ${theme.scrollThumb};
            --slactac-scroll-thumb-hover: ${theme.scrollThumbHover};
            --slactac-btn-edit-bg: ${theme.editBtnBg};
            --slactac-btn-edit-hover: ${theme.editBtnBgHover};
            --slactac-btn-edit-fg: ${theme.editBtnFg};
            --slactac-btn-del-bg: ${theme.delBtnBg};
            --slactac-btn-del-hover: ${theme.delBtnBgHover};
            --slactac-btn-del-fg: ${theme.delBtnFg};
        `;

        mgr.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:2px 2px 10px;">
                <div>
                    <h3 class="slactac-i18n-manager-title" style="margin:0; font-size:15px; color:${theme.titleText}; letter-spacing:0.1px;">${t('managerTitle')}</h3>
                    <div style="font-size:12px; color:${theme.aliasCountText}; margin-top:3px;">${Object.keys(data).length} aliases</div>
                </div>
                <button id="mgr-close-btn" class="slactac-mgr-btn-close" style="width:28px; height:28px; border-radius:7px; background:${theme.closeBg}; border:none; color:${theme.panelText}; cursor:pointer; font-size:16px; line-height:1;">✕</button>
            </div>
            <div id="mgr-list-container" style="max-height:320px; overflow-y:auto; box-sizing:border-box; padding-right:8px; scrollbar-gutter:stable;"></div>
        `;
        document.body.appendChild(mgr);

        document.getElementById('mgr-close-btn').onclick = () => mgr.remove();
        const listContainer = document.getElementById('mgr-list-container');

        const entries = Object.entries(data);
        if (entries.length === 0) {
            listContainer.innerHTML = `<div class="slactac-i18n-no-entries" style="text-align:center; padding:20px; color:${theme.subtleText};">${t('noEntries')}</div>`;
        } else {
            entries.forEach(([old, curr]) => {
                const item = document.createElement('div');
                item.style.cssText = `display:flex; justify-content:space-between; align-items:center; gap:10px; padding:10px; border:none; border-radius:10px; background:${theme.cardBg}; margin-bottom:8px;`;
                item.innerHTML = `
                    <div style="flex:1; min-width:0; overflow:hidden;">
                        <div style="font-size:11px; color:${theme.subtleText}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${old}</div>
                        <div style="font-size:13px; font-weight:700; color:${theme.panelText}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">${curr}</div>
                    </div>
                `;
                const btnGroup = document.createElement('div');
                btnGroup.style.display = 'flex';
                btnGroup.style.gap = '5px';
                btnGroup.style.flexShrink = '0';

                const editBtn = document.createElement('button');
                editBtn.setAttribute('data-slactac-role', 'edit');
                editBtn.className = 'slactac-mgr-btn-edit';
                editBtn.innerText = t('edit');
                editBtn.style.cssText = 'border-radius:8px; padding:6px 9px; cursor:pointer; font-size:11px; font-weight:700;';
                editBtn.onclick = async () => {
                    const nextName = await showAliasModal(old, curr);
                    if (nextName === null) return;
                    if (nextName.trim() === '') delete data[old];
                    else data[old] = nextName.trim();
                    await saveNames(data);
                    queueTransformations();
                    showManager();
                };

                const delBtn = document.createElement('button');
                delBtn.setAttribute('data-slactac-role', 'delete');
                delBtn.className = 'slactac-mgr-btn-delete';
                delBtn.innerText = t('del');
                delBtn.style.cssText = 'border-radius:8px; padding:6px 9px; cursor:pointer; font-size:11px; font-weight:700;';
                delBtn.onclick = async () => {
                    delete data[old];
                    await saveNames(data);
                    queueTransformations();
                    showManager();
                };

                btnGroup.appendChild(editBtn); btnGroup.appendChild(delBtn);
                item.appendChild(btnGroup); listContainer.appendChild(item);
            });
        }
    };
    const rerenderManagerWithTheme = () => {
        const current = document.getElementById(MGR_ID);
        if (!current) return;
        const list = current.querySelector('#mgr-list-container');
        const previousScrollTop = list ? list.scrollTop : 0;
        showManager();
        const nextList = document.querySelector(`#${MGR_ID} #mgr-list-container`);
        if (nextList) nextList.scrollTop = previousScrollTop;
    };
    const checkThemeUpdate = () => {
        if (!document.getElementById(MGR_ID)) return;
        const nextSignature = themeSignature(getManagerTheme());
        if (!nextSignature || nextSignature === lastThemeSignature) return;
        rerenderManagerWithTheme();
    };

    // 3. Full row selection mode (expanded selectors)
    const startSelector = () => {
        if (isSelecting) return;
        isSelecting = true;
        ensureSelectorStyles();
        const theme = getManagerTheme();
        let hoveredElement = null;

        const guide = document.createElement('div');
        guide.id = GUIDE_ID;
        guide.innerHTML = t('guide');
        guide.style.cssText = `position:fixed; top:70px; left:50%; transform:translateX(-50%); background:${theme.panelBg}; color:${theme.titleText}; padding:12px 30px; border-radius:30px; z-index:20000; font-weight:bold; pointer-events:none; box-shadow:0 4px 15px rgba(0,0,0,0.3);`;
        document.body.appendChild(guide);
        document.body.classList.add(SELECT_MODE_CLASS);
        document.body.style.cursor = 'crosshair';

        const updateHoverState = (target) => {
            const match = resolveSelectionTarget(target);
            const nextHover = match ? (match.rowCandidate || match.textElement) : null;
            if (hoveredElement && hoveredElement !== nextHover) {
                hoveredElement.classList.remove(SELECT_HOVER_CLASS);
            }
            hoveredElement = nextHover;
            if (hoveredElement) {
                hoveredElement.classList.add(SELECT_HOVER_CLASS);
            }
            return match;
        };

        const onMove = (e) => {
            updateHoverState(e.target);
        };

        const onCapture = (e) => {
            const match = updateHoverState(e.target);
            if (!match) {
                finish();
                return;
            }

            // Block default click propagation only when a valid name target is found.
            e.preventDefault();
            e.stopImmediatePropagation();
            const oldName = match.oldName;
            finish();

            setTimeout(async () => {
                const newName = await showAliasModal(oldName, getStoredNames()[oldName] || '');
                if (newName === null) return;
                const data = getStoredNames();
                if (newName.trim() === '') delete data[oldName];
                else data[oldName] = newName.trim();
                await saveNames(data);
                queueTransformations();
            }, 0);
        };

        const onEsc = (e) => { if (e.key === 'Escape') finish(); };
        const finish = () => {
            isSelecting = false;
            document.body.classList.remove(SELECT_MODE_CLASS);
            document.body.style.cursor = 'default';
            if (document.getElementById(GUIDE_ID)) document.getElementById(GUIDE_ID).remove();
            if (hoveredElement) hoveredElement.classList.remove(SELECT_HOVER_CLASS);
            hoveredElement = null;
            window.removeEventListener('click', onCapture, true);
            window.removeEventListener('mousemove', onMove, true);
            window.removeEventListener('keydown', onEsc);
        };
        window.addEventListener('click', onCapture, true);
        window.addEventListener('mousemove', onMove, true);
        window.addEventListener('keydown', onEsc);
    };

    // 4. Inject action button
    const injectBtn = () => {
        const target = document.querySelector('.p-top_nav__ai_apps_button__container');
        if (target && !document.getElementById('slactac-toggle-btn')) {
            const wrapper = document.createElement('div');
            wrapper.id = 'slactac-toggle-btn';
            wrapper.className = 'p-ia4_top_nav__item';
            wrapper.innerHTML = `
                <button
                    class="c-button-unstyled c-button c-button--small p-top_nav__ai_apps_button p-top_nav__ai_apps_button__primary"
                    type="button"
                    style="padding:0 8px;"
                    tabindex="0"
                    aria-label="${t('buttonTitle')}"
                    data-sk="tooltip_parent"
                >
                    <div style="font-size:16px;" class="p-top_nav__ai_apps_button_ai_icon p-top_nav__ai_apps_button_add_bot_icon_by_itself">✨</div>
                </button>
                <span hidden data-sk="tooltip">${t('buttonTitle')}</span>
            `;
            const button = wrapper.querySelector('button');
            if (button) {
                bindTopButtonTooltip(button);
                button.onclick = startSelector;
                button.oncontextmenu = (e) => {
                    e.preventDefault();
                    showManager();
                };
            }
            target.before(wrapper);
        }
    };

    const checkLocaleUpdate = () => {
        if (!refreshLocale()) return;
        updateLocalizedUI();
    };

    injectBtn();
    const observer = new MutationObserver(() => {
        injectBtn();
        queueTransformations();
        checkLocaleUpdate();
        checkThemeUpdate();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const localeAttrObserver = new MutationObserver(() => {
        checkLocaleUpdate();
    });
    if (document.documentElement) {
        localeAttrObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
    window.addEventListener('focus', () => {
        checkLocaleUpdate();
        checkThemeUpdate();
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkLocaleUpdate();
            checkThemeUpdate();
        }
    });

    Promise.resolve()
    .then(enablePersistentStorage)
    .then(loadNames)
    .then(() => {
        queueTransformations();
        updateLocalizedUI();
    }).catch((err) => {
        console.error('Failed to initialize storage:', err);
        storageReady = true;
        queueTransformations();
        updateLocalizedUI();
    });
})();
