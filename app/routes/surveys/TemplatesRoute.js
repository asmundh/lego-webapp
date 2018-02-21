import { connect } from 'react-redux';
import prepare from 'app/utils/prepare';
import {
  addSurvey,
  deleteSurvey,
  fetchTemplates
} from '../../actions/SurveyActions';
import SurveyPage from './components/SurveyList/SurveyPage';
import { compose } from 'redux';
import { selectSurveyTemplates } from 'app/reducers/surveys';
import { LoginPage } from 'app/components/LoginForm';
import replaceUnlessLoggedIn from 'app/utils/replaceUnlessLoggedIn';
import { push } from 'react-router-redux';
import loadingIndicator from 'app/utils/loadingIndicator';

const loadData = (props, dispatch) => dispatch(fetchTemplates());

const mapStateToProps = (state, props) => ({
  surveys: selectSurveyTemplates(state, props),
  notFetching: !state.surveys.fetching
});

const mapDispatchToProps = {
  addSurvey,
  deleteSurvey,
  push
};

export default compose(
  replaceUnlessLoggedIn(LoginPage),
  prepare(loadData),
  connect(mapStateToProps, mapDispatchToProps),
  loadingIndicator(['notFetching', 'surveys'])
)(SurveyPage);
