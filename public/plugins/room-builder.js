/**
 * Room Builder Plugin - Menu Costruzioni
 *
 * Plugin esterno per Nitro Client.
 * Richiede il RoomBuilderPlugin.jar lato server (Arcturus).
 *
 * Se rimuovi questo file, il bottone scompare automaticamente dalla UI.
 *
 * Colori e stili uniformati al tema Nitro Client.
 */
(function ()
{
    'use strict';

    // ─── Nitro Theme Colors ───
    var THEME = {
        // Card / Window
        headerBg:       '#1E7295',
        headerText:     '#FFFFFF',
        tabsBg:         '#185D79',
        cardBorder:     '#283F5D',
        contentBg:      '#DFDFDF',

        // Buttons
        btnPrimary:     '#3c6d82',
        btnPrimaryBrd:  '#1a617f',
        btnPrimaryHov:  '#4a8199',
        btnActive:      '#185D79',
        btnActiveBrd:   '#0f4a63',
        btnActiveHov:   '#1E7295',
        btnDanger:      '#a81a12',
        btnDangerBrd:   '#b9322a',
        btnDangerHov:   '#c43a32',
        btnSuccess:     '#00800b',
        btnSuccessBrd:  '#006d09',
        btnWarning:     '#ffc107',
        btnWarningBrd:  '#f3c12a',

        // Dark panel (infostand style)
        darkBg:         '#212131',
        darkBorder:     '#383853',
        darkShadow:     'inset 0 5px rgba(38,38,57,0.6), inset 0 -4px rgba(25,25,37,0.6)',

        // Grid items
        gridBg:         '#CDD3D9',
        gridBorder:     '#B6BEC5',
        gridActiveBg:   '#ECECEC',
        gridActiveBrd:  '#FFFFFF',

        // Text
        textLight:      '#FFFFFF',
        textDark:       '#212529',
        textMuted:      '#B6BEC5',

        // Typography
        fontFamily:     'Ubuntu, sans-serif',
        fontSm:         '0.7875rem',
        fontBase:       '0.9rem',

        // Misc
        borderRadius:   '0.5rem',
        borderRadiusSm: '0.25rem',
        scrollThumb:    'rgba(30, 114, 149, 0.4)',
        scrollThumbHov: 'rgba(30, 114, 149, 0.8)'
    };

    function waitForApi(callback, maxRetries)
    {
        if (maxRetries === undefined) maxRetries = 50;
        if (window.NitroPlugins)
        {
            callback(window.NitroPlugins);
            return;
        }
        if (maxRetries <= 0)
        {
            console.warn('[RoomBuilder] NitroPlugins API not found after retries');
            return;
        }
        setTimeout(function () { waitForApi(callback, maxRetries - 1); }, 200);
    }

    // ─── Constants ───
    var FLOOR = 10;
    var WALL = 20;

    // ─── Send chat command to server via proper API ───
    function sendCommand(api, command)
    {
        try
        {
            api.sendChat(':' + command);
        }
        catch (e)
        {
            console.warn('[RoomBuilder] sendCommand error:', e);
        }
    }

    // ─── Section Label Helper ───
    function createSectionLabel(container, text)
    {
        var label = document.createElement('div');
        label.textContent = text;
        label.style.cssText = 'font-family:' + THEME.fontFamily + ';font-size:' + THEME.fontSm + ';font-weight:bold;color:' + THEME.textDark + ';margin:10px 0 6px 0;padding-bottom:4px;border-bottom:1px solid ' + THEME.gridBorder + ';text-transform:uppercase;letter-spacing:0.5px';
        container.appendChild(label);
    }

    // ─── Slider Helper ───
    function createSlider(container, label, min, max, value, step, onChange)
    {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:6px;padding:4px 6px;background:' + THEME.gridBg + ';border:1px solid ' + THEME.gridBorder + ';border-radius:' + THEME.borderRadiusSm;

        var lbl = document.createElement('span');
        lbl.textContent = label;
        lbl.style.cssText = 'width:70px;color:' + THEME.textDark + ';font-family:' + THEME.fontFamily + ';font-size:' + THEME.fontSm + ';font-weight:bold;flex-shrink:0';

        var slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step || 1;
        slider.value = value;
        slider.style.cssText = 'flex:1;height:6px;cursor:pointer;accent-color:' + THEME.headerBg;

        var valDisplay = document.createElement('span');
        valDisplay.textContent = value;
        valDisplay.style.cssText = 'width:28px;color:' + THEME.textDark + ';font-family:' + THEME.fontFamily + ';font-size:' + THEME.fontSm + ';text-align:center;font-weight:bold';

        var saveBtn = document.createElement('button');
        saveBtn.innerHTML = '&#x1F4BE;';
        saveBtn.title = 'Salva';
        saveBtn.style.cssText = 'width:28px;height:28px;min-height:28px;display:flex;align-items:center;justify-content:center;background:' + THEME.btnSuccess + ';border:2px solid ' + THEME.btnSuccessBrd + ';border-radius:' + THEME.borderRadius + ';cursor:pointer;font-size:11px;color:' + THEME.textLight;

        var resetBtn = document.createElement('button');
        resetBtn.innerHTML = '&#x21A9;';
        resetBtn.title = 'Ripristina';
        resetBtn.style.cssText = 'width:28px;height:28px;min-height:28px;display:flex;align-items:center;justify-content:center;background:' + THEME.btnDanger + ';border:2px solid ' + THEME.btnDangerBrd + ';border-radius:' + THEME.borderRadius + ';color:' + THEME.textLight + ';cursor:pointer;font-size:13px;font-weight:bold';

        slider.addEventListener('input', function ()
        {
            valDisplay.textContent = slider.value;
        });

        saveBtn.addEventListener('click', function ()
        {
            if (onChange) onChange(Number(slider.value));
        });

        resetBtn.addEventListener('click', function ()
        {
            slider.value = value;
            valDisplay.textContent = value;
            if (onChange) onChange(Number(value));
        });

        row.appendChild(lbl);
        row.appendChild(slider);
        row.appendChild(valDisplay);
        row.appendChild(saveBtn);
        row.appendChild(resetBtn);
        container.appendChild(row);

        return { slider: slider, valDisplay: valDisplay };
    }

    // ─── Button Helper ───
    function createButton(container, label, onClick, opts)
    {
        opts = opts || {};
        var isActive = opts.active || false;
        var isDanger = opts.danger || false;

        var bgColor = isDanger ? THEME.btnDanger : (isActive ? THEME.btnActive : THEME.btnPrimary);
        var borderColor = isDanger ? THEME.btnDangerBrd : (isActive ? THEME.btnActiveBrd : THEME.btnPrimaryBrd);
        var hoverColor = isDanger ? THEME.btnDangerHov : (isActive ? THEME.btnActiveHov : THEME.btnPrimaryHov);

        var btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = 'padding:0.25rem 0.5rem;border-radius:' + THEME.borderRadius + ';color:' + THEME.textLight + ';font-family:' + THEME.fontFamily + ';font-size:' + THEME.fontSm + ';font-weight:500;cursor:pointer;border:2px solid ' + borderColor + ';transition:background .15s;background:' + bgColor + ';min-height:28px;box-shadow:none;' + (opts.fullWidth ? 'width:100%;' : '') + (opts.extraStyle || '');

        btn.addEventListener('mouseenter', function () { btn.style.background = hoverColor; });
        btn.addEventListener('mouseleave', function () { btn.style.background = bgColor; });
        btn.addEventListener('click', function ()
        {
            if (onClick) onClick(btn);
        });
        if (container) container.appendChild(btn);
        return btn;
    }

    // ─── Grid Row Helper ───
    function createButtonRow(container, cols, buttons)
    {
        var row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:6px;margin-bottom:6px';
        buttons.forEach(function (b) { createButton(row, b.label, b.onClick, b); });
        container.appendChild(row);
    }

    // ─── Utility: iterate room floor objects ───
    function forEachFloorObject(api, callback)
    {
        var session = api.getRoomSession();
        var engine = api.getRoomEngine();
        if (!session || !engine) return;
        var objects = engine.getRoomObjects(session.roomId, FLOOR);
        for (var i = 0; i < objects.length; i++)
        {
            var obj = engine.getRoomObject(session.roomId, objects[i].id, FLOOR);
            if (obj) callback(obj, objects[i].id, session.roomId, engine);
        }
    }

    // ─── State ───
    var state = {
        hidePyramids: false,
        hideCarpets: false,
        hideWalls: false,
        hideWired: false,
        frozen: false,
        teleporting: false
    };

    // ─── Stack clipboard (client-side memory) ───
    var stackClipboard = null;

    // ─── Plugin Init ───
    waitForApi(function (api)
    {
        api.register({
            name: 'room-builder',
            label: 'Menu costruzioni',
            icon: 'icon-cog',

            onOpen: function ()
            {
                var content = api.createWindow('room-builder', 'Menu costruzioni', 440);
                if (!content) return;

                // Apply Nitro content area style to the content container
                content.style.cssText = 'padding:10px;font-family:' + THEME.fontFamily + ';font-size:' + THEME.fontBase;

                // ─── Warning banner (Nitro tabs style) ───
                var banner = document.createElement('div');
                banner.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;background:' + THEME.tabsBg + ';border:1px solid ' + THEME.cardBorder + ';border-radius:' + THEME.borderRadiusSm + ';padding:8px 12px;margin-bottom:12px';
                banner.innerHTML = '<span style="font-size:16px">&#x26A0;</span><span style="color:' + THEME.textLight + ';font-family:' + THEME.fontFamily + ';font-size:' + THEME.fontSm + '">Assicurati di non spammare per non essere <b>mutato</b></span><span style="font-size:16px">&#x26A0;</span>';
                content.appendChild(banner);

                // ─── Sliders Section ───
                createSectionLabel(content, 'Controlli');

                var slidersDiv = document.createElement('div');
                slidersDiv.style.marginBottom = '8px';

                createSlider(slidersDiv, 'Altezza', -10, 40, 0, 1, function (val)
                {
                    try
                    {
                        sendCommand(api, 'autotile ' + val);
                    }
                    catch (e) { console.warn('[RoomBuilder] Height:', e); }
                });

                createSlider(slidersDiv, 'Velocita', 0, 10, 4, 1, function (val)
                {
                    sendCommand(api, 'rb_speed ' + val);
                });

                content.appendChild(slidersDiv);

                // ─── Screenshot ───
                var ssDiv = document.createElement('div');
                ssDiv.style.marginBottom = '8px';
                createButton(ssDiv, 'Fai lo screenshot della stanza', function ()
                {
                    api.takeScreenshot();
                }, { fullWidth: true, extraStyle: 'padding:6px 12px;' });
                content.appendChild(ssDiv);

                // ─── Avatar Section ───
                createSectionLabel(content, 'Avatar');

                createButtonRow(content, 2, [
                    {
                        label: state.frozen ? '\u2713 Avatar bloccato' : 'Blocca avatar',
                        active: state.frozen,
                        onClick: function (btn)
                        {
                            state.frozen = !state.frozen;
                            btn.textContent = state.frozen ? '\u2713 Avatar bloccato' : 'Blocca avatar';
                            btn.style.background = state.frozen ? THEME.btnActive : THEME.btnPrimary;
                            btn.style.borderColor = state.frozen ? THEME.btnActiveBrd : THEME.btnPrimaryBrd;
                            sendCommand(api, 'blocca');
                        }
                    },
                    {
                        label: state.teleporting ? '\u2713 Teletrasporto ON' : 'Teletrasporto',
                        active: state.teleporting,
                        onClick: function (btn)
                        {
                            state.teleporting = !state.teleporting;
                            btn.textContent = state.teleporting ? '\u2713 Teletrasporto ON' : 'Teletrasporto';
                            btn.style.background = state.teleporting ? THEME.btnActive : THEME.btnPrimary;
                            btn.style.borderColor = state.teleporting ? THEME.btnActiveBrd : THEME.btnPrimaryBrd;
                            sendCommand(api, 'rb_teleport');
                        }
                    }
                ]);

                // ─── Visibility Section ───
                createSectionLabel(content, 'Visibilita');

                createButtonRow(content, 3, [
                    {
                        label: state.hidePyramids ? 'Mostra piramidi' : 'Nascondi piramidi',
                        active: state.hidePyramids,
                        onClick: function (btn)
                        {
                            state.hidePyramids = !state.hidePyramids;
                            btn.style.background = state.hidePyramids ? THEME.btnActive : THEME.btnPrimary;
                            btn.style.borderColor = state.hidePyramids ? THEME.btnActiveBrd : THEME.btnPrimaryBrd;
                            btn.textContent = state.hidePyramids ? 'Mostra piramidi' : 'Nascondi piramidi';
                            try
                            {
                                forEachFloorObject(api, function (obj, objId, roomId, engine)
                                {
                                    if (obj.type && obj.type.toLowerCase().indexOf('pyramid') >= 0)
                                    {
                                        engine.changeObjectModelData(roomId, objId, FLOOR, 'furniture_alpha_multiplier', state.hidePyramids ? 0 : 1);
                                    }
                                });
                            }
                            catch (e) { console.warn('[RoomBuilder]', e); }
                        }
                    },
                    {
                        label: state.hideCarpets ? 'Mostra tappeti' : 'Nascondi tappeti',
                        active: state.hideCarpets,
                        onClick: function (btn)
                        {
                            state.hideCarpets = !state.hideCarpets;
                            btn.style.background = state.hideCarpets ? THEME.btnActive : THEME.btnPrimary;
                            btn.style.borderColor = state.hideCarpets ? THEME.btnActiveBrd : THEME.btnPrimaryBrd;
                            btn.textContent = state.hideCarpets ? 'Mostra tappeti' : 'Nascondi tappeti';
                            try
                            {
                                forEachFloorObject(api, function (obj, objId, roomId, engine)
                                {
                                    if (obj.model)
                                    {
                                        var sizeZ = obj.model.getValue('furniture_size_z');
                                        if (sizeZ !== undefined && sizeZ <= 0.01)
                                        {
                                            engine.changeObjectModelData(roomId, objId, FLOOR, 'furniture_alpha_multiplier', state.hideCarpets ? 0 : 1);
                                        }
                                    }
                                });
                            }
                            catch (e) { console.warn('[RoomBuilder]', e); }
                        }
                    },
                    {
                        label: state.hideWalls ? 'Mostra mura' : 'Nascondi mura',
                        active: state.hideWalls,
                        onClick: function (btn)
                        {
                            state.hideWalls = !state.hideWalls;
                            btn.style.background = state.hideWalls ? THEME.btnActive : THEME.btnPrimary;
                            btn.style.borderColor = state.hideWalls ? THEME.btnActiveBrd : THEME.btnPrimaryBrd;
                            btn.textContent = state.hideWalls ? 'Mostra mura' : 'Nascondi mura';
                            try
                            {
                                var session = api.getRoomSession();
                                var engine = api.getRoomEngine();
                                if (!session || !engine) return;
                                var objects = engine.getRoomObjects(session.roomId, WALL);
                                for (var i = 0; i < objects.length; i++)
                                {
                                    engine.changeObjectModelData(session.roomId, objects[i].id, WALL, 'furniture_alpha_multiplier', state.hideWalls ? 0 : 1);
                                }
                            }
                            catch (e) { console.warn('[RoomBuilder]', e); }
                        }
                    }
                ]);

                // ─── Stack Section ───
                createSectionLabel(content, 'Pila (Stack)');

                createButtonRow(content, 4, [
                    {
                        label: 'Annulla pila',
                        onClick: function ()
                        {
                            sendCommand(api, 'autotile');
                        }
                    },
                    {
                        label: 'Seleziona pila',
                        onClick: function ()
                        {
                            try
                            {
                                var session = api.getRoomSession();
                                var engine = api.getRoomEngine();
                                if (!session || !engine) return;
                                var objects = engine.getRoomObjects(session.roomId, FLOOR);
                                stackClipboard = [];
                                for (var i = 0; i < objects.length; i++)
                                {
                                    var obj = engine.getRoomObject(session.roomId, objects[i].id, FLOOR);
                                    if (obj && obj.location)
                                    {
                                        stackClipboard.push({
                                            id: objects[i].id,
                                            x: Math.floor(obj.location.x),
                                            y: Math.floor(obj.location.y),
                                            z: obj.location.z,
                                            dir: obj.direction ? obj.direction.x : 0
                                        });
                                    }
                                }
                                console.log('[RoomBuilder] Pila selezionata: ' + stackClipboard.length + ' oggetti');
                            }
                            catch (e) { console.warn('[RoomBuilder]', e); }
                        }
                    },
                    {
                        label: 'Copia pila',
                        onClick: function ()
                        {
                            if (!stackClipboard || stackClipboard.length === 0)
                            {
                                console.log('[RoomBuilder] Nessuna pila selezionata');
                                return;
                            }
                            console.log('[RoomBuilder] Pila copiata: ' + stackClipboard.length + ' oggetti');
                        }
                    },
                    {
                        label: 'Posiziona pila',
                        onClick: function ()
                        {
                            if (!stackClipboard || stackClipboard.length === 0)
                            {
                                console.log('[RoomBuilder] Nessuna pila da posizionare');
                                return;
                            }
                            try
                            {
                                for (var i = 0; i < stackClipboard.length; i++)
                                {
                                    var item = stackClipboard[i];
                                    api.sendStackHeight(item.id, Math.round(item.z * 100));
                                }
                                console.log('[RoomBuilder] Pila posizionata: ' + stackClipboard.length + ' oggetti');
                            }
                            catch (e) { console.warn('[RoomBuilder]', e); }
                        }
                    }
                ]);

                // ─── Room Management Section ───
                createSectionLabel(content, 'Gestione stanza');

                createButtonRow(content, 3, [
                    {
                        label: 'Impostazioni',
                        onClick: function () { api.createLinkEvent('navigator/toggle-room-info'); }
                    },
                    {
                        label: 'Reload stanza',
                        onClick: function ()
                        {
                            try
                            {
                                var session = api.getRoomSession();
                                if (session) api.createLinkEvent('navigator/goto/' + session.roomId);
                            }
                            catch (e) { }
                        }
                    },
                    {
                        label: 'Unload stanza',
                        onClick: function ()
                        {
                            api.visitDesktop();
                        }
                    }
                ]);

                // ─── Floor Tools Section ───
                createSectionLabel(content, 'Strumenti pavimento');

                createButtonRow(content, 4, [
                    {
                        label: 'Max Tile',
                        onClick: function ()
                        {
                            sendCommand(api, 'maxtile');
                        }
                    },
                    {
                        label: 'Auto Tile',
                        onClick: function ()
                        {
                            sendCommand(api, 'autotile');
                        }
                    },
                    {
                        label: 'No Item Floor',
                        danger: true,
                        onClick: function ()
                        {
                            if (confirm('Sei sicuro? Tutti i furni verranno rimossi dal pavimento!'))
                            {
                                sendCommand(api, 'noitemfloor');
                            }
                        }
                    },
                    {
                        label: 'Edit Floorplan',
                        onClick: function () { api.createLinkEvent('floor-editor/toggle'); }
                    }
                ]);

                // ─── Wired Section ───
                createSectionLabel(content, 'Wired');

                createButtonRow(content, 2, [
                    {
                        label: state.hideWired ? 'Mostra wired' : 'Nascondi wired',
                        active: state.hideWired,
                        onClick: function (btn)
                        {
                            state.hideWired = !state.hideWired;
                            btn.style.background = state.hideWired ? THEME.btnActive : THEME.btnPrimary;
                            btn.style.borderColor = state.hideWired ? THEME.btnActiveBrd : THEME.btnPrimaryBrd;
                            btn.textContent = state.hideWired ? 'Mostra wired' : 'Nascondi wired';
                            try
                            {
                                forEachFloorObject(api, function (obj, objId, roomId, engine)
                                {
                                    if (obj.type && (obj.type.toLowerCase().indexOf('wf_') >= 0 || obj.type.toLowerCase().indexOf('wired') >= 0))
                                    {
                                        engine.changeObjectModelData(roomId, objId, FLOOR, 'furniture_alpha_multiplier', state.hideWired ? 0 : 1);
                                    }
                                });
                            }
                            catch (e) { console.warn('[RoomBuilder]', e); }
                        }
                    },
                    {
                        label: 'Prendi tutti gli wired',
                        danger: true,
                        onClick: function ()
                        {
                            sendCommand(api, 'pickwired');
                        }
                    }
                ]);

                // ─── Spacer ───
                var spacer = document.createElement('div');
                spacer.style.cssText = 'height:1px;background:' + THEME.gridBorder + ';margin:10px 0';
                content.appendChild(spacer);

                // ─── Back button (danger style like close button) ───
                var backDiv = document.createElement('div');
                createButton(backDiv, 'Torna indietro', function ()
                {
                    api.destroyWindow('room-builder');
                }, { fullWidth: true, danger: true, extraStyle: 'padding:6px 12px;' });
                content.appendChild(backDiv);
            },

            onClose: function ()
            {
                if (window.NitroPlugins) window.NitroPlugins.destroyWindow('room-builder');
            }
        });

        console.log('[NitroPlugins] Room Builder plugin loaded (Nitro theme)');
    });
})();
