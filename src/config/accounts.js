export const ACCOUNTS = [
  { id: 'act_1437623713860893', name: 'Panobianco Marajoara',      short: 'Panobianco',     group: 'Panobianco', initials: 'PB', color: '#FF6B8A' },
  { id: 'act_2380515695737088', name: 'DarksGym Oficial',          short: 'DarksGym Oficial',group: 'DarksGym',  initials: 'DO', color: '#00D4FF' },
  { id: 'act_1362413675444528', name: 'DarksGym - Jorge Beretta',  short: 'Jorge Beretta',  group: 'DarksGym',  initials: 'JB', color: '#00AADD' },
  { id: 'act_2090206971742954', name: 'RedFitness - Andorinha',    short: 'RedFitness',     group: 'RedFitness', initials: 'RF', color: '#FF4D4D' },
  { id: 'act_1806762126942849', name: 'CA - 01 - X NET',           short: 'X NET',          group: 'X NET',     initials: 'XN', color: '#5B8DEF' },
  { id: 'act_732967402654010',  name: 'Fluxo & Darks Gym',         short: 'Fluxo & Darks',  group: 'DarksGym',  initials: 'FD', color: '#7B61FF' },
  { id: 'act_1482882379516047', name: 'DarksGym 001',              short: 'DarksGym 001',   group: 'DarksGym',  initials: '01', color: '#00D4FF' },
  { id: 'act_1302468848261341', name: 'DarksGym Mauá',             short: 'DarksGym Mauá',  group: 'DarksGym',  initials: 'MA', color: '#00C4EE' },
  { id: 'act_735892832391655',  name: 'DarksGym 002',              short: 'DarksGym 002',   group: 'DarksGym',  initials: '02', color: '#009BBB' },
  { id: 'act_1264604788062031', name: 'DarksGym 003',              short: 'DarksGym 003',   group: 'DarksGym',  initials: '03', color: '#0088AA' },
  { id: 'act_380744416975283',  name: 'DarksGym Principal',        short: 'DarksGym Principal', group: 'DarksGym', initials: 'PR', color: '#00D4FF' },
  { id: 'act_1633891900916418', name: 'DarksGym Ribeirão Pires',   short: 'Ribeirão Pires', group: 'DarksGym',  initials: 'RP', color: '#00BBDD' },
  { id: 'act_991329105934272',  name: 'DarksGym Santo André',      short: 'Santo André',    group: 'DarksGym',  initials: 'SA', color: '#00AACC' },
  { id: 'act_2011736099593538', name: 'DarksGym Queiros Filho',    short: 'Queiros Filho',  group: 'DarksGym',  initials: 'QF', color: '#0099BB' },
  { id: 'act_1235315075269551', name: 'Goodbe',                    short: 'Goodbe',         group: 'Goodbe',    initials: 'GB', color: '#00E5A0' },
]

export const GROUPS = [...new Set(ACCOUNTS.map(a => a.group))]

export const DATE_PRESETS = [
  { label: 'Hoje',           value: 'today' },
  { label: 'Ontem',          value: 'yesterday' },
  { label: 'Últimos 7 dias', value: 'last_7d' },
  { label: 'Últimos 14 dias',value: 'last_14d' },
  { label: 'Últimos 30 dias',value: 'last_30d' },
  { label: 'Este mês',       value: 'this_month' },
  { label: 'Mês anterior',   value: 'last_month' },
]

export const INSIGHTS_FIELDS = [
  'spend', 'impressions', 'clicks', 'ctr', 'cpm', 'reach',
  'actions', 'cost_per_action_type', 'frequency',
].join(',')
