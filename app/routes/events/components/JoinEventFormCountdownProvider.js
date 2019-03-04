// @flow

import React, { Component, type Node, type ComponentType } from 'react';
import moment from 'moment-timezone';
import type { Dateish, Event, EventRegistration } from 'app/models';

type Action =
  | 'REGISTRATION_AVAILABLE'
  | '90_SECONDS_LEFT'
  | '10_MINUTE_LEFT'
  | 'STILL_WAITING'
  | 'REGISTERED_OR_REGISTRATION_ALREADY_OPENED'
  | 'REGISTRATION_NOT_AVAILABLE'
  | 'RESET';

export type Props = {
  event: Event,
  registration: ?EventRegistration,
  render?: (state: State) => Node
};

const COUNTDOWN_STARTS_WHEN_MINUTES_LEFT = 10;

// How often to check when to start the real countdown
const CHECK_COUNTDOWN_START_INTERVAL = 10000;

// How often to run the countdown, should be <= 1000
const COUNTDOWN_INTERVAL = 1000;

// Must be sorted lo->hi
const TICK_ACTIONS: Array<[number, Action]> = [
  [0, 'REGISTRATION_AVAILABLE'],
  [90 * 1000, '90_SECONDS_LEFT'],
  [60 * 10000, '10_MINUTE_LEFT'],
  [Infinity, 'STILL_WAITING']
];

type State = {
  formOpen: boolean,
  captchaOpen: boolean,
  buttonOpen: boolean,
  registrationOpensIn: ?string
};

const countdownReducer = (
  state: State,
  action: Action,
  registrationOpensIn: ?string
): State => {
  switch (action) {
    case 'REGISTRATION_AVAILABLE':
      return {
        buttonOpen: true,
        formOpen: true,
        captchaOpen: true,
        registrationOpensIn: null
      };

    case '90_SECONDS_LEFT':
      return {
        captchaOpen: true,
        formOpen: true,
        buttonOpen: false,
        registrationOpensIn
      };

    case '10_MINUTE_LEFT':
      return {
        captchaOpen: false,
        formOpen: true,
        buttonOpen: false,
        registrationOpensIn
      };

    case 'REGISTERED_OR_REGISTRATION_ALREADY_OPENED':
      return {
        formOpen: true,
        captchaOpen: true,
        buttonOpen: true,
        registrationOpensIn: null
      };

    case 'REGISTRATION_NOT_AVAILABLE':
    case 'RESET':
      return {
        formOpen: false,
        captchaOpen: false,
        buttonOpen: false,
        registrationOpensIn: null
      };

    default:
      return state;
  }
};

function withCountdown(WrappedComponent: ComponentType<Props>) {
  return class JoinEventFormCountdownProvider extends Component<Props, State> {
    state = {
      formOpen: false,
      captchaOpen: false,
      buttonOpen: false,
      registrationOpensIn: null
    };

    countdownProbeTimer: IntervalID;
    countdownTimer: IntervalID;

    componentDidMount() {
      this.setupEventCountdown(this.props.event, this.props.registration);
    }

    componentWillReceiveProps(nextProps: Props) {
      if (
        (nextProps.event.activationTime && !this.props.event.activationTime) ||
        nextProps.registration !== this.props.registration
      ) {
        this.dispatch('RESET');
        this.setupEventCountdown(nextProps.event, nextProps.registration);
      }
    }

    componentWillUnmount() {
      clearInterval(this.countdownProbeTimer);
      clearInterval(this.countdownTimer);
    }

    dispatch(action: Action, registrationOpensIn: ?string) {
      this.setState(state =>
        countdownReducer(state, action, registrationOpensIn)
      );
    }

    setupEventCountdown = (event: Event, registration: ?EventRegistration) => {
      const { activationTime, startTime } = event;
      const poolActivationTime = moment(activationTime);
      const currentTime = moment();

      // TODO: the 2 hour subtract is a hardcoded close time and should be improved
      const registrationIsClosed = currentTime.isAfter(
        moment(startTime).subtract(2, 'hours')
      );
      if ((!registration && !activationTime) || registrationIsClosed) {
        this.dispatch('REGISTRATION_NOT_AVAILABLE');
        return;
      }

      if (registration || poolActivationTime.isBefore(currentTime)) {
        this.dispatch('REGISTERED_OR_REGISTRATION_ALREADY_OPENED');
        return;
      }

      const timeUntilRegistrationOpens = getTimeUntil(poolActivationTime);

      if (
        timeUntilRegistrationOpens.asMinutes() <=
        COUNTDOWN_STARTS_WHEN_MINUTES_LEFT
      ) {
        this.initiateCountdown(poolActivationTime);
        return;
      }

      const poll = () => {
        const timeUntilRegistrationOpens = getTimeUntil(poolActivationTime);

        if (
          timeUntilRegistrationOpens.asMinutes() <=
          COUNTDOWN_STARTS_WHEN_MINUTES_LEFT
        ) {
          clearInterval(this.countdownProbeTimer);
          this.initiateCountdown(poolActivationTime);
        }
      };

      poll();
      this.countdownProbeTimer = setInterval(
        poll,
        CHECK_COUNTDOWN_START_INTERVAL
      );
    };

    initiateCountdown(finishTime: Dateish) {
      const poll = () => {
        const timeUntilRegistrationOpens = getTimeUntil(
          finishTime
        ).asMilliseconds();

        if (timeUntilRegistrationOpens <= 0) {
          clearInterval(this.countdownTimer);
        }

        const [, action] =
          TICK_ACTIONS.find(
            ([time, action]) => timeUntilRegistrationOpens <= time
          ) || [];

        const registrationOpensIn = moment(
          timeUntilRegistrationOpens + 1000
        ).format('mm:ss');
        if (action) {
          this.dispatch(action, registrationOpensIn);
        }
      };

      poll();
      this.countdownTimer = setInterval(poll, COUNTDOWN_INTERVAL);
    }

    render() {
      return <WrappedComponent {...this.props} {...this.state} />;
    }
  };
}

function getTimeDifference(first: moment, second: moment): number {
  return moment(first).diff(moment(second));
}

export function getTimeUntil(
  time: Dateish,
  currentTime?: Dateish = moment()
): moment$MomentDuration {
  return moment.duration(getTimeDifference(time, currentTime), 'milliseconds');
}

export default withCountdown;
