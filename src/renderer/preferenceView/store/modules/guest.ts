import * as types from '../mutation-types';

const state = {
  about: {
    about: [],
    Monarc: [],
    preferences: [],
  },
  extensions: {},
};

const mutations = {
  [types.UPDATE_ABOUT](stateContext: any, data: any): void {
    stateContext.about.about = data.about;
    stateContext.about.Monarc = data.Monarc;
    stateContext.about.preferences = data.preferences;
    if (data.path) {
      stateContext.about.path = data.path;
    }
  },
  [types.UPDATE_EXTENSIONS](stateContext: any, data: any): void {
    stateContext.extensions = data;
  },
};

export default {
  state,
  mutations,
};
