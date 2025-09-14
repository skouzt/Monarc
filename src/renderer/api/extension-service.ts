/* eslint-disable max-len */

import { ipcRenderer } from 'electron';
import * as url from 'url';
import Vue from 'vue';

import apiFactory, { initializeExtensionApi } from './api-factory';

export default class ExtensionService {
  newtabOverrides = '';
  manifestMap: Monarc.API.ManifestMap = {};
  instance: Vue;
  constructor(vueInstance) {
    this.instance = vueInstance;
    this.instance.$electron.ipcRenderer.once('registered-local-commands', (event, manifestMap) => {
      this.manifestMap = manifestMap;
      initializeExtensionApi(apiFactory(this.instance)).then(() => {
        this.register();
        this.registerAction();
      });
    });
    this.instance.$electron.ipcRenderer.send('register-local-commands');
  }

  register() {
    const ipc = ipcRenderer;
    const vue: any = this.instance;
    ipc.on('Monarc-env-app-name', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-env-app-name-result-${data.suffix}`,
          require('Monarc').env.appName()
        );
      }
    });
    ipc.on('Monarc-env-app-version', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-env-app-version-result-${data.suffix}`,
          require('Monarc').env.appVersion()
        );
      }
    });

    ipc.on('Monarc-browser-action-set-icon', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-browser-action-set-icon-result-${data.suffix}`,
          require('Monarc').browserAction.setIcon(data.extensionId, data.startPage, data.details)
        );
      }
    });
    ipc.on('Monarc-browser-action-set-badge-text', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          'Monarc-browser-action-set-badge-text-result',
          require('Monarc').browserAction.setBadgeText(data.extensionId, data.details)
        );
      }
    });
    ipc.on('Monarc-browser-action-set-badge-background-color', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          'Monarc-browser-action-set-badge-background-color-result',
          require('Monarc').browserAction.setBadgeBackgroundColor(data.extensionId, data.details)
        );
      }
    });
    ipc.on('Monarc-browser-action-add-listener-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-browser-action-add-listener-on-message-result-${data.digest}`,
            args
          );
        };
        const onClickedEvent = require('Monarc').browserAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-browser-action-remove-listener-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-browser-action-add-listener-on-message-result-${data.digest}`,
            args
          );
        };
        const onClickedEvent = require('Monarc').browserAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-browser-action-emit-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onClickedEvent = require('Monarc').browserAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.emit(data.message, data.sender);
        }
      }
    });

    ipc.on('Monarc-page-action-set-icon', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-page-action-set-icon-result-${data.suffix}`,
          require('Monarc').pageAction.setIcon(data.extensionId, data.startPage, data.details)
        );
      }
    });
    ipc.on('Monarc-page-action-show', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        vue.$store.dispatch('setPageAction', {
          tabId: data.tabId,
          extensionId: data.extensionId,
          enabled: data.enabled,
        });
      }
    });
    ipc.on('Monarc-page-action-hide', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        vue.$store.dispatch('setPageAction', {
          tabId: data.tabId,
          extensionId: data.extensionId,
          enabled: data.enabled,
        });
      }
    });
    ipc.on('Monarc-page-action-add-listener-on-clicked', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-page-action-add-listener-on-clicked-result-${data.digest}`,
            args
          );
        };
        const onClickedEvent = require('Monarc').pageAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-page-action-remove-listener-on-clicked', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-page-action-add-listener-on-clicked-result-${data.digest}`,
            args
          );
        };
        const onClickedEvent = require('Monarc').pageAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-page-action-emit-on-clicked', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onClickedEvent = require('Monarc').pageAction.onClicked(data.webContentsId);
        if (onClickedEvent) {
          onClickedEvent.emit(data.args, data.sender);
        }
      }
    });

    ipc.on('Monarc-commands-add-listener-on-command', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-commands-add-listener-on-command-result-${data.digest}`,
            args
          );
        };
        const onCommandEvent = require('Monarc').commands.onCommand(data.webContentsId);
        if (onCommandEvent) {
          onCommandEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-commands-remove-listener-on-command', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-commands-add-listener-on-command-result-${data.digest}`,
            args
          );
        };
        const onCommandEvent = require('Monarc').commands.onCommand(data.webContentsId);
        if (onCommandEvent) {
          onCommandEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-commands-emit-on-command', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onCommandEvent = require('Monarc').commands.onCommand(data.webContentsId);
        if (onCommandEvent) {
          onCommandEvent.emit(data.args);
        }
      }
    });

    ipc.on('Monarc-alarms-get', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-alarms-get-result-${data.suffix}`,
          vue.getAlarm(data.name)
        );
      }
    });
    ipc.on('Monarc-alarms-get-all', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-alarms-get-all-result-${data.suffix}`,
          vue.getAllAlarm()
        );
      }
    });
    ipc.on('Monarc-alarms-clear', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-alarms-clear-result-${data.suffix}`,
          vue.clearAlarm(data.name)
        );
      }
    });
    ipc.on('Monarc-alarms-clear-all', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-alarms-clear-all-result-${data.suffix}`,
          vue.clearAllAlarm()
        );
      }
    });
    ipc.on('Monarc-alarms-create', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        vue.createAlarm(data.name, data.alarmInfo);
      }
    });
    ipc.on('Monarc-alarms-add-listener-on-alarm', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`Monarc-alarms-add-listener-on-alarm-result-${data.digest}`, args);
        };
        const { onAlarmEvent } = vue;
        if (onAlarmEvent) {
          onAlarmEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-alarms-remove-listener-on-alarm', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`Monarc-alarms-add-listener-on-alarm-result-${data.digest}`, args);
        };
        const { onAlarmEvent } = vue;
        if (onAlarmEvent) {
          onAlarmEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-alarms-emit-on-alarm', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const { onAlarmEvent } = vue;
        if (onAlarmEvent) {
          onAlarmEvent.emit(data.alarm, data.sender);
        }
      }
    });

    ipc.on('Monarc-runtime-send-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').runtime.sendMessage(
          data.extensionId,
          data.message,
          data.external,
          data.webContentsId
        );
      }
    });
    ipc.on('Monarc-runtime-add-listener-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`Monarc-runtime-add-listener-on-message-result-${data.digest}`, args);
        };
        const onMessageEvent = require('Monarc').runtime.onMessage(data.webContentsId);
        if (onMessageEvent) {
          onMessageEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-runtime-remove-listener-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`Monarc-runtime-add-listener-on-message-result-${data.digest}`, args);
        };
        const onMessageEvent = require('Monarc').runtime.onMessage(data.webContentsId);
        if (onMessageEvent) {
          onMessageEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-runtime-emit-on-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onMessageEvent = require('Monarc').runtime.onMessage(data.webContentsId);
        if (onMessageEvent) {
          onMessageEvent.emit(data.message, data.sender);
        }
      }
    });
    ipc.on('Monarc-runtime-add-listener-on-message-external', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`Monarc-runtime-add-listener-on-message-external-result-${data.digest}`, args);
        };
        const onMessageExternalEvent = require('Monarc').runtime.onMessageExternal(data.webContentsId);
        if (onMessageExternalEvent) {
          onMessageExternalEvent.addListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-runtime-remove-listener-on-message-external', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(`Monarc-runtime-add-listener-on-message-external-result-${data.digest}`, args);
        };
        const onMessageExternalEvent = require('Monarc').runtime.onMessageExternal(data.webContentsId);
        if (onMessageExternalEvent) {
          onMessageExternalEvent.removeListener(wrapper);
        }
      }
    });
    ipc.on('Monarc-runtime-emit-on-message-external', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const onMessageExternalEvent = require('Monarc').runtime.onMessageExternal(data.webContentsId);
        if (onMessageExternalEvent) {
          onMessageExternalEvent.emit(data.message, data.sender);
        }
      }
    });

    ipc.on('Monarc-tabs-get', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-get-result-${data.suffix}`,
          require('Monarc').tabs.get(data.tabId)
        );
      }
    });
    ipc.on('Monarc-tabs-get-current', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-get-current-result-${data.suffix}`,
          require('Monarc').tabs.getCurrent(data.guestInstanceId)
        );
      }
    });
    ipc.on('Monarc-tabs-duplicate', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-duplicate-result-${data.suffix}`,
          require('Monarc').tabs.duplicate(data.tabId)
        );
      }
    });
    ipc.on('Monarc-tabs-query', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-query-result-${data.suffix}`,
          require('Monarc').tabs.query(data.queryInfo)
        );
      }
    });
    ipc.on('Monarc-tabs-update', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-update-result-${data.suffix}`,
          require('Monarc').tabs.update(data.tabId, data.updateProperties)
        );
      }
    });
    ipc.on('Monarc-tabs-reload', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-reload-result-${data.suffix}`,
          require('Monarc').tabs.reload(data.tabId, data.reloadProperties)
        );
      }
    });
    ipc.on('Monarc-tabs-create', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-create-result-${data.suffix}`,
          require('Monarc').tabs.create(data.createProperties)
        );
      }
    });
    ipc.on('Monarc-tabs-remove', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-remove-result-${data.suffix}`,
          require('Monarc').tabs.remove(data.tabIds)
        );
      }
    });
    ipc.on('Monarc-tabs-detect-language', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').tabs.detectLanguage(data.tabId, data.suffix, data.webContentsId);
      }
    });
    ipc.on('Monarc-tabs-detect-language-result', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-detect-language-result-${data.suffix}`,
          data.value
        );
      }
    });
    ipc.on('Monarc-tabs-execute-script', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-execute-script-result-${data.suffix}`,
          require('Monarc').tabs.executeScript(data.tabId, data.details)
        );
      }
    });
    ipc.on('Monarc-tabs-insert-css', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-insert-css-result-${data.suffix}`,
          require('Monarc').tabs.insertCSS(data.tabId, data.details)
        );
      }
    });
    ipc.on('Monarc-tabs-send-message', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-tabs-send-message-result-${data.suffix}`,
          require('Monarc').tabs.sendMessage(data.tabId, data.message)
        );
      }
    });
    ipc.on('Monarc-tabs-add-listener-on-activated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-tabs-add-listener-on-activated-result-${data.digest}`,
            args
          );
        };
        require('Monarc').tabs.onActivated.addListener(wrapper);
      }
    });
    ipc.on('Monarc-tabs-remove-listener-on-activated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-tabs-add-listener-on-activated-result-${data.digest}`,
            args
          );
        };
        require('Monarc').tabs.onActivated.removeListener(wrapper);
      }
    });
    ipc.on('Monarc-tabs-emit-on-activated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').tabs.onActivated.emit(data.args);
      }
    });
    ipc.on('Monarc-tabs-add-listener-on-updated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-tabs-add-listener-on-updated-result-${data.digest}`,
            args
          );
        };
        require('Monarc').tabs.onUpdated.addListener(wrapper);
      }
    });
    ipc.on('Monarc-tabs-remove-listener-on-updated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-tabs-add-listener-on-updated-result-${data.digest}`,
            args
          );
        };
        require('Monarc').tabs.onUpdated.removeListener(wrapper);
      }
    });
    ipc.on('Monarc-tabs-emit-on-updated', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').tabs.onUpdated.emit(data.args);
      }
    });
    ipc.on('Monarc-tabs-add-listener-on-created', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-tabs-add-listener-on-created-result-${data.digest}`,
            args
          );
        };
        require('Monarc').tabs.onCreated.addListener(wrapper);
      }
    });
    ipc.on('Monarc-tabs-remove-listener-on-created', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-tabs-add-listener-on-created-result-${data.digest}`,
            args
          );
        };
        require('Monarc').tabs.onCreated.removeListener(wrapper);
      }
    });
    ipc.on('Monarc-tabs-emit-on-created', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').tabs.onCreated.emit(data.args);
      }
    });
    ipc.on('Monarc-tabs-add-listener-on-removed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-tabs-add-listener-on-removed-result-${data.digest}`,
            args
          );
        };
        require('Monarc').tabs.onRemoved.addListener(wrapper);
      }
    });
    ipc.on('Monarc-tabs-remove-listener-on-removed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-tabs-add-listener-on-removed-result-${data.digest}`,
            args
          );
        };
        require('Monarc').tabs.onRemoved.removeListener(wrapper);
      }
    });
    ipc.on('Monarc-tabs-emit-on-removed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').tabs.onRemoved.emit(data.args);
      }
    });

    ipc.on('Monarc-windows-get', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-windows-get-result-${data.suffix}`,
          require('Monarc').windows.get(data.windowId, data.getInfo)
        );
      }
    });
    ipc.on('Monarc-windows-get-current', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-windows-get-current-result-${data.suffix}`,
          require('Monarc').windows.getCurrent(data.getInfo, data.guestInstanceId)
        );
      }
    });
    ipc.on('Monarc-windows-get-all', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-windows-get-all-result-${data.suffix}`,
          require('Monarc').windows.getAll(data.getInfo)
        );
      }
    });

    ipc.on('Monarc-storage-add-listener-on-changed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-storage-add-listener-on-changed-result-${data.digest}`,
            args
          );
        };
        require('Monarc').storage.onChanged.addListener(wrapper);
      }
    });
    ipc.on('Monarc-storage-remove-listener-on-changed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-storage-add-listener-on-changed-result-${data.digest}`,
            args
          );
        };
        require('Monarc').storage.onChanged.removeListener(wrapper);
      }
    });
    ipc.on('Monarc-storage-emit-on-changed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').storage.onChanged.emit(data.args);
      }
    });

    ipc.on('Monarc-context-menus-create', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-context-menus-create-result-${data.suffix}`,
          require('Monarc').contextMenus.create(data.menuItems, data.webContentsId)
        );
      }
    });
    ipc.on('Monarc-context-menus-remove', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-context-menus-remove-result-${data.suffix}`,
          require('Monarc').contextMenus.remove(data.menuItems, data.webContentsId)
        );
      }
    });
    ipc.on('Monarc-context-menus-remove-all', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-context-menus-remove-all-result-${data.suffix}`,
          require('Monarc').contextMenus.removeAll(data.menuItems, data.webContentsId)
        );
      }
    });

    ipc.on('Monarc-web-navigation-get-frame', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').webNavigation.getFrame(data.details, data.suffix, data.webContentsId);
      }
    });
    ipc.on('Monarc-web-navigation-get-frame-result', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-web-navigation-get-frame-result-${data.suffix}`,
          data.details
        );
      }
    });
    ipc.on('Monarc-web-navigation-get-all-frames', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').webNavigation.getAllFrames(data.details, data.suffix, data.webContentsId);
      }
    });
    ipc.on('Monarc-web-navigation-get-all-frames-result', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        webContents.send(
          `Monarc-web-navigation-get-all-frames-result-${data.suffix}`,
          data.details
        );
      }
    });
    ipc.on('Monarc-web-navigation-add-listener-on-before-navigate', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-web-navigation-add-listener-on-before-navigate-result-${data.digest}`,
            args
          );
        };
        require('Monarc').webNavigation.onBeforeNavigate.addListener(wrapper);
      }
    });
    ipc.on('Monarc-web-navigation-remove-listener-on-before-navigate', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-web-navigation-add-listener-on-before-navigate-result-${data.digest}`,
            args
          );
        };
        require('Monarc').webNavigation.onBeforeNavigate.removeListener(wrapper);
      }
    });
    ipc.on('Monarc-web-navigation-emit-on-before-navigate', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').webNavigation.onBeforeNavigate.emit(data.args);
      }
    });
    ipc.on('Monarc-web-navigation-add-listener-on-committed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-web-navigation-add-listener-on-committed-result-${data.digest}`,
            args
          );
        };
        require('Monarc').webNavigation.onCommitted.addListener(wrapper);
      }
    });
    ipc.on('Monarc-web-navigation-remove-listener-on-committed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-web-navigation-add-listener-on-committed-result-${data.digest}`,
            args
          );
        };
        require('Monarc').webNavigation.onCommitted.removeListener(wrapper);
      }
    });
    ipc.on('Monarc-web-navigation-emit-on-committed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').webNavigation.onCommitted.emit(data.args);
      }
    });
    ipc.on('Monarc-web-navigation-add-listener-on-dom-content-loaded', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-web-navigation-add-listener-on-dom-content-loaded-result-${data.digest}`,
            args
          );
        };
        require('Monarc').webNavigation.onDOMContentLoaded.addListener(wrapper);
      }
    });
    ipc.on('Monarc-web-navigation-remove-listener-on-dom-content-loaded', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-web-navigation-add-listener-on-dom-content-loaded-result-${data.digest}`,
            args
          );
        };
        require('Monarc').webNavigation.onDOMContentLoaded.removeListener(wrapper);
      }
    });
    ipc.on('Monarc-web-navigation-emit-on-dom-content-loaded', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').webNavigation.onDOMContentLoaded.emit(data.args);
      }
    });
    ipc.on('Monarc-web-navigation-add-listener-on-completed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-web-navigation-add-listener-on-completed-result-${data.digest}`,
            args
          );
        };
        require('Monarc').webNavigation.onCompleted.addListener(wrapper);
      }
    });
    ipc.on('Monarc-web-navigation-remove-listener-on-completed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-web-navigation-add-listener-on-completed-result-${data.digest}`,
            args
          );
        };
        require('Monarc').webNavigation.onCompleted.removeListener(wrapper);
      }
    });
    ipc.on('Monarc-web-navigation-emit-on-completed', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').webNavigation.onCompleted.emit(data.args);
      }
    });
    ipc.on('Monarc-web-navigation-add-listener-on-created-navigation-target', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-web-navigation-add-listener-on-created-navigation-target-result-${data.digest}`,
            args
          );
        };
        require('Monarc').webNavigation.onCreatedNavigationTarget.addListener(wrapper);
      }
    });
    ipc.on('Monarc-web-navigation-remove-listener-on-created-navigation-target', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const wrapper = function (...args) {
          webContents.send(
            `Monarc-web-navigation-add-listener-on-created-navigation-target-result-${data.digest}`,
            args
          );
        };
        require('Monarc').webNavigation.onCreatedNavigationTarget.removeListener(wrapper);
      }
    });
    ipc.on('Monarc-web-navigation-emit-on-created-navigation-target', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        require('Monarc').webNavigation.onCreatedNavigationTarget.emit(data.args);
      }
    });
    ipc.on('Monarc-web-request-intercepted', (event, data) => {
      if (vue.$electron.remote.webContents.fromId(data.webContentsId)) {
        const webContents = vue.$electron.remote.webContents.fromId(data.webContentsId);
        const { details, requestId } = data;
        const tab = require('Monarc').tabs.query({ webContentsId: details.webContentsId })[0];

        details.tabId = (tab === undefined) ? -1 : tab.id;
        webContents.send(
          `Monarc-web-request-${data.eventLispCaseName}-intercepted-${data.digest}`,
          requestId,
          details
        );
      }
    });
  }

  update(): void {
    this.instance.$electron.ipcRenderer.once('registered-local-commands', (event, manifestMap) => {
      initializeExtensionApi(apiFactory(this.instance)).then(() => {
        this.manifestMap = manifestMap;
        this.register();
        this.registerAction();
      });
    });
    this.instance.$electron.ipcRenderer.send('register-local-commands');
  }

  registerAction() {
    const manifest: Monarc.API.ManifestObject[] = [];
    const backgroundPages =
      this.instance.$electron.ipcRenderer.sendSync('get-background-pages');

    this.newtabOverrides = '';
    Object.keys(this.manifestMap).forEach((extension) => {
      const ext = this.manifestMap[extension];
      if (ext) {
        if (backgroundPages[extension]) {
          const { webContentsId } = backgroundPages[extension];
          ext.webContentsId = webContentsId;
        }
        const cuo = ext.chrome_url_overrides;
        if (cuo) {
          Object.keys(cuo).forEach((k) => {
            this[`${k}Overrides`] = `${url.format({
              protocol: 'Monarc-extension',
              slashes: true,
              hostname: ext.extensionId,
              pathname: cuo[k],
            })}`;
          });
        }
        manifest.push(ext);
      }
    });

    (this.instance.$refs.navbar as any).extensions = manifest;
  }
}
