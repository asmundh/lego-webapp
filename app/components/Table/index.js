// @flow

import React, { Component, type Node } from 'react';
import Icon from 'app/components/Icon';
import LoadingIndicator from 'app/components/LoadingIndicator';
import { TextInput, CheckBox } from 'app/components/Form';
import { Overlay } from 'react-overlays';
import cx from 'classnames';
import { isEmpty } from 'lodash';
import InfiniteScroll from 'react-infinite-scroller';
import styles from './Table.css';
import { get } from 'lodash';

type sortProps = {
  direction?: 'asc' | 'desc',
  sort?: string
};

type checkFilter = {
  label: string,
  value: any
};

type columnProps = {
  dataIndex: string,
  title?: string,
  sorter?: (any, any) => number,
  filter?: Array<checkFilter>,
  /*
   * Map the value to to "another" value to use
   * for filtering. Eg. the result from the backend
   * is in english, and the search should be in norwegian
   *
   */
  filterMapping?: any => any,
  search?: boolean,
  width?: number,
  render?: (any, Object) => Node
};

type Props = {
  rowKey?: string,
  columns: Array<columnProps>,
  data: Array<Object>,
  hasMore: boolean,
  loading: boolean,
  onChange?: (filters: Object, sort: sortProps) => void,
  onLoad?: (filters: Object, sort: sortProps) => void
};

type State = {
  filters: Object,
  isShown: Object,
  sort: sortProps
};

export default class Table extends Component<Props, State> {
  props: Props;
  components: { [string]: ?HTMLDivElement } = {};

  state: State = {
    sort: {},
    filters: {},
    isShown: {}
  };

  static defaultProps = {
    rowKey: 'id'
  };

  toggleSearch = (dataIndex: string) => {
    this.setState({
      isShown: {
        [dataIndex]: !this.state.isShown[dataIndex]
      }
    });
  };

  toggleFilter = (dataIndex: string) => {
    this.setState({
      isShown: {
        [dataIndex]: !this.state.isShown[dataIndex]
      }
    });
  };

  onSearchInput = ({ target }: SyntheticInputEvent<*>, dataIndex: string) => {
    this.setState(
      { filters: { ...this.state.filters, [dataIndex]: target.value } },
      () => this.onChange()
    );
  };

  onFilterInput = (value: any, dataIndex: string) => {
    this.setState(
      { filters: { ...this.state.filters, [dataIndex]: value } },
      () => this.onChange()
    );
  };

  checkifActive = (dataIndex: string) => {
    return (
      this.state.filters[dataIndex].length &&
      typeof this.state.filters[dataIndex].find(e => e.value) !== 'undefined'
    );
  };

  renderCell = (column: columnProps, data: Object, index: number) => {
    const cellData = get(data, column.dataIndex);
    return (
      <td key={`${column.dataIndex}-${index}-${data.id}`}>
        {column.render ? column.render(cellData, data) : cellData}
      </td>
    );
  };

  renderHeadCell = (
    { dataIndex, search, title, sorter, filter }: columnProps,
    index: number
  ) => {
    const { filters, isShown } = this.state;
    return (
      <th key={`${dataIndex}-${index}`}>
        {title}
        {sorter && (
          <div className={styles.sorter}>
            <Icon name="arrow-up" />
            <Icon name="arrow-down" />
          </div>
        )}
        {search && (
          <div className={styles.searchIcon}>
            <div
              ref={c => (this.components[dataIndex] = c)}
              className={styles.searchIcon}
            >
              <Icon
                onClick={() => this.toggleSearch(dataIndex)}
                name="search"
                className={cx(
                  styles.icon,
                  ((filters[dataIndex] && filters[dataIndex].length) ||
                    isShown[dataIndex]) &&
                    styles.iconActive
                )}
              />
            </div>
            <Overlay
              show={isShown[dataIndex]}
              onHide={() => this.toggleSearch(dataIndex)}
              placement="bottom"
              container={this.components[dataIndex]}
              target={() => this.components[dataIndex]}
              rootClose
            >
              <div className={styles.overlay}>
                <TextInput
                  autoFocus
                  placeholder="Filtrer"
                  value={filters[dataIndex]}
                  onChange={e => this.onSearchInput(e, dataIndex)}
                  onKeyDown={({ keyCode }) => {
                    if (keyCode === 13) {
                      this.toggleSearch(dataIndex);
                    }
                  }}
                />
              </div>
            </Overlay>
          </div>
        )}
        {filter && (
          <div className={styles.filterIcon}>
            <div
              ref={c => (this.components[dataIndex] = c)}
              className={styles.filterIcon}
            >
              <Icon
                onClick={() => this.toggleFilter(dataIndex)}
                name="funnel"
                className={cx(
                  styles.icon,
                  (filters[dataIndex] !== undefined || isShown[dataIndex]) &&
                    styles.iconActive
                )}
              />
            </div>
            <Overlay
              show={isShown[dataIndex]}
              onHide={() => this.toggleFilter(dataIndex)}
              placement="bottom"
              container={this.components[dataIndex]}
              target={() => this.components[dataIndex]}
              rootClose
            >
              <div className={styles.checkbox}>
                {filter.map(({ label, value }) => (
                  <CheckBox
                    key={label}
                    label={label}
                    value={value === this.state.filters[dataIndex]}
                    onChange={() => this.onFilterInput(value, dataIndex)}
                  />
                ))}
                <a
                  onClick={() =>
                    this.setState({ filters: { [dataIndex]: undefined } })
                  }
                >
                  Nullstill
                </a>
              </div>
            </Overlay>
          </div>
        )}
      </th>
    );
  };

  filter = (item: Object) => {
    if (isEmpty(this.state.filters)) {
      return true;
    }

    const match = Object.keys(this.state.filters).filter(key => {
      if (this.state.filters[key] === undefined) {
        return true;
      }
      if (typeof this.state.filters[key] === 'boolean') {
        return this.state.filters[key] === get(item, key);
      }

      const filter = this.state.filters[key].toLowerCase();

      if (!filter.length) {
        return true;
      }

      const { filterMapping = val => val } =
        this.props.columns.find(col => col.dataIndex == key) || {};

      return filterMapping(get(item, key))
        .toLowerCase()
        .includes(filter);
    }).length;

    return match > 0;
  };

  loadMore = () => {
    if (this.props.onLoad && !this.props.loading) {
      this.props.onLoad(this.state.filters, this.state.sort);
    }
  };

  onChange = () => {
    if (this.props.onChange) {
      this.props.onChange(this.state.filters, this.state.sort);
    }
  };

  render() {
    const { columns, data, rowKey, hasMore, loading } = this.props;
    return (
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column, index) => this.renderHeadCell(column, index))}
          </tr>
        </thead>
        <InfiniteScroll
          element="tbody"
          hasMore={hasMore}
          loadMore={this.loadMore}
          threshold={50}
          loader={
            <tr>
              <td className={styles.loader} colSpan={columns.length}>
                <LoadingIndicator loading={loading} />
              </td>
            </tr>
          }
        >
          {data.filter(this.filter).map((item, index) => (
            <tr key={item[rowKey]}>
              {columns.map((column, index) =>
                this.renderCell(column, item, index)
              )}
            </tr>
          ))}
        </InfiniteScroll>
      </table>
    );
  }
}
