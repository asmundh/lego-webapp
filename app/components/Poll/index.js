// @flow

import React from 'react';
import Button from 'app/components/Button';
import styles from './Poll.css';
import type { PollEntity, OptionEntity } from 'app/reducers/polls';
import { Link } from 'react-router';
import Icon from 'app/components/Icon';
import { Flex } from 'app/components/Layout';

type Props = {
  poll: PollEntity,
  handleVote: (pollId: number, optionId: number) => Promise<*>,
  backgroundLight?: boolean,
  truncate?: number,
  details?: boolean
};

type State = {
  truncateOptions: boolean,
  optionsToShow: Array<OptionEntity>,
  expanded: boolean
};

class Poll extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const { options } = props.poll;
    if (props.truncate && options.length > props.truncate) {
      this.state = {
        truncateOptions: true,
        optionsToShow: options.slice(0, props.truncate),
        expanded: false
      };
    } else {
      this.state = {
        truncateOptions: false,
        optionsToShow: options,
        expanded: true
      };
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.poll.options !== this.props.poll.options) {
      this.props.truncate && !this.state.expanded
        ? this.setState({
            optionsToShow: this.props.poll.options.slice(0, this.props.truncate)
          })
        : this.setState({ optionsToShow: this.props.poll.options });
    }
  }

  toggleTruncate = () => {
    const { truncate, poll } = this.props;
    const { expanded } = this.state;
    const { options } = poll;
    expanded
      ? this.setState({
          optionsToShow: options.slice(0, truncate),
          expanded: false
        })
      : this.setState({ optionsToShow: options, expanded: true });
  };

  render() {
    const { poll, handleVote, backgroundLight, details } = this.props;
    const { truncateOptions, optionsToShow, expanded } = this.state;
    const { id, title, description, options, hasAnswered, totalVotes } = poll;

    return (
      <div
        className={`${styles.poll} ${backgroundLight ? styles.pollLight : ''}`}
      >
        <Link to={`/polls/${id}`}>
          <Icon name="stats" />
          <span className={styles.pollHeader}>{title}</span>
        </Link>
        {details && (
          <div>
            <p>{description}</p>
          </div>
        )}
        {hasAnswered && (
          <div className={styles.answeredPoll}>
            <table className={styles.pollTable}>
              <tbody>
                {optionsToShow.map(option => (
                  <tr key={option.id}>
                    <td className={styles.textColumn}>{option.name}</td>
                    <td className={styles.graphColumn}>
                      {option.votes !== 0 ? (
                        <div className={styles.fullGraph}>
                          <div
                            style={{
                              width: `${Math.round(
                                (option.votes / totalVotes) * 100
                              )}%`
                            }}
                          >
                            <div className={styles.pollGraph}>
                              <span>
                                {Math.floor((option.votes / totalVotes) * 100) +
                                  '%'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className={styles.noVotes}>Ingen stemmer</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!hasAnswered && (
          <Flex column>
            {options &&
              optionsToShow.map(option => (
                <Flex style={{ justifyContent: 'center' }} key={option.id}>
                  <Button
                    className={styles.voteButton}
                    onClick={() => handleVote(poll.id, option.id)}
                  >
                    {option.name}
                  </Button>
                </Flex>
              ))}
          </Flex>
        )}
        {truncateOptions && (
          <div className={styles.moreOptionsLink}>
            <Icon
              onClick={this.toggleTruncate}
              className={styles.arrow}
              size={20}
              name={expanded ? 'arrow-up' : 'arrow-down'}
            />
          </div>
        )}
      </div>
    );
  }
}

export default Poll;
