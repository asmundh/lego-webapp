import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { dispatched } from '@webkom/react-prepare';
import { Content } from 'app/components/Content';
import { search } from 'app/actions/SearchActions';
import SearchPage from 'app/components/Search/SearchPage';
import { push } from 'react-router-redux';
import { debounce } from 'lodash';
import { selectResult } from 'app/reducers/search';

const loadData = (props, dispatch) => {
  const query = props.location.query.q;
  if (query) {
    dispatch(search(query));
  }
};

const mapStateToProps = (state, props) => {
  const results = selectResult(state);

  return {
    location: props.location,
    searching: state.search.searching,
    results
  };
};

const mapDispatchToProps = dispatch => ({
  handleSelect: result => dispatch(push(result.link)),
  onQueryChanged: debounce(query => {
    dispatch(push(`/search?q=${query}`));
    if (query) {
      dispatch(search(query));
    }
  }, 300)
});

function SearchPageWrapper(props) {
  return (
    <Content>
      <SearchPage {...props} />
    </Content>
  );
}

export default compose(
  dispatched(loadData, {
    componentWillReceiveProps: false
  }),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(SearchPageWrapper);
