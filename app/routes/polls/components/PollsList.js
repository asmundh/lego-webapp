// @flow

import React from 'react';
import { Link } from 'react-router';
import { Content } from 'app/components/Content';
import NavigationTab, { NavigationLink } from 'app/components/NavigationTab';
import styles from './PollsList.css';
import Paginator from 'app/components/Paginator';
import Icon from 'app/components/Icon';
import LoadingIndicator from 'app/components/LoadingIndicator';

type props = {
  polls: Array<Object>,
  actionGrant: Array<String>,
  fetching: Boolean,
  hasMore: Boolean,
  fetchAll: ({ next?: boolean }) => Promise<*>
};

const PollsList = (props: props, state) => {
  const { polls, actionGrant, fetchAll, hasMore, fetching } = props;
  return (
    <Content>
      <NavigationTab title="Avstemninger">
        {actionGrant.includes('create') && (
          <NavigationLink to="/polls/new">Lag ny</NavigationLink>
        )}
      </NavigationTab>
      <Paginator
        infiniteScroll={true}
        hasMore={hasMore}
        fetching={fetching}
        fetchNext={() => {
          fetchAll({
            next: true
          });
        }}
      >
        <section className={styles.pollsList}>
          {polls.map(poll => (
            <Link
              key={poll.id}
              to={`/polls/${poll.id}`}
              className={styles.pollItem}
            >
              <div className={styles.pollListItem}>
                <div style={{ display: 'flex' }}>
                  <Icon className={styles.icon} name="stats" size="40" />
                  <h3 className={styles.heading}>{poll.title}</h3>
                </div>
                <span>{`Antall stemmer: ${poll.totalVotes}`}</span>
                {poll.hasAnswered ? (
                  <span className={styles.answeredText}>
                    Svart
                    <Icon name="checkmark-circle-outline" size="20" style={{marginLeft: '10px', color: 'green'}} />
                  </span>
                )
                : (
                  <span className={styles.answeredText}>
                    Ikke svart
                    <Icon name="close-circle" size="20" style={{marginLeft: '10px', color: '#c0392b'}} />
                  </span>
                )}
              </div>
            </Link>
          ))}
        </section>
      </Paginator>
    </Content>
  );
};

export default PollsList;
