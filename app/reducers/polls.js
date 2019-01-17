// @flow

import { createSelector } from 'reselect';
import createEntityReducer from '../utils/createEntityReducer';
import { Poll } from '../actions/ActionTypes';

export type PollEntity = {
  id: number,
  title: string,
  description: string,
  pinned: boolean,
  tags: Array<string>,
  hasAnswered: boolean,
  totalVotes: number,
  options: Array<OptionEntity>
};

export type OptionEntity = {
  id: number,
  name: string,
  votes: number
};

export default createEntityReducer({
  key: 'polls',
  types: {
    fetch: [Poll.FETCH, Poll.FETCH_ALL],
    mutate: Poll.CREATE
  },
  mutate(state, action) {
    switch (action.type) {
      case Poll.DELETE.SUCCESS:
        return {
          ...state,
          items: state.items.filter(id => action.meta.polls !== id)
        };
      default:
        return state;
    }
  }
});

export const selectPolls = createSelector(
  state => state.polls.byId,
  state => state.polls.items,
  (pollsById, pollsIds) => {
    return pollsIds.map(id => pollsById[id]);
  }
);

export const selectPollsById = createSelector(
  selectPolls,
  (state, pollsId) => pollsId,
  (polls, pollsId) => {
    if (!polls || !pollsId) return {};
    return polls.find(polls => Number(polls.id) === Number(pollsId));
  }
);

export const selectPinnedPolls = createSelector(selectPolls, polls =>
  polls.filter(polls => polls.pinned)
);
