import {
  filterByAllowlistValues,
  filterAndUpdateGhesDataByAllowlistValues,
} from '../../lib/index.js'

describe('audit log event fitering', () => {
  it('match single allowlist value', () => {
    const eventsToProcess = [
      {
        action: 'repo.create',
        _allowlists: ['user'],
        description: 'repo was created',
      },
    ]

    const filteredEvents = filterByAllowlistValues(eventsToProcess, 'user')
    expect(filteredEvents[0].action).toEqual('repo.create')
  })

  it('match multiple allowlist values', () => {
    const eventsToProcess = [
      {
        action: 'repo.create',
        _allowlists: ['user'],
        description: 'repo was created',
      },
      {
        action: 'repo.delete',
        _allowlists: ['organization'],
        description: 'repo was deleted',
      },
    ]

    const filteredEvents = filterByAllowlistValues(eventsToProcess, ['user', 'organization'])
    expect(filteredEvents[0].action).toEqual('repo.create')
    expect(filteredEvents.length).toEqual(2)
  })

  it('non-match allowlist value', () => {
    const eventsToProcess = [
      {
        action: 'repo.create',
        _allowlists: ['user'],
        description: 'repo was created',
      },
    ]

    const filteredEvents = filterByAllowlistValues(eventsToProcess, 'organization')
    expect(filteredEvents.length).toBe(0)
  })

  it('ghes filter and update multiple ghes versions', () => {
    const eventsToProcess = [
      {
        action: 'repo.create',
        description: 'repo was created',
        ghes: {
          '3.10': {
            _allowlists: ['user'],
          },
          3.11: {
            _allowlists: ['user'],
          },
        },
      },
    ]

    const currentEvents = {
      'ghes-3.11': {
        organization: [
          {
            action: 'repo.update',
            description: 'repo was created',
          },
        ],
      },
      'ghes-3.12': {
        enterprise: [
          {
            action: 'repo.delete',
            description: 'repo was deleted',
          },
        ],
      },
    }
    const auditLogPage = 'user'

    // this function mutates `currentEvents` so is updated as new GHES versioned
    // events from `eventToProcess` are processed and added.
    filterAndUpdateGhesDataByAllowlistValues(
      eventsToProcess,
      'user',
      currentEvents,
      {},
      auditLogPage,
    )
    const getActions = (version) =>
      currentEvents[version][auditLogPage].map((event) => event.action)
    expect(getActions('ghes-3.10').includes('repo.create')).toBe(true)
    expect(getActions('ghes-3.11').includes('repo.create')).toBe(true)
    expect(auditLogPage in currentEvents['ghes-3.12']).toBeFalsy()
  })
})
