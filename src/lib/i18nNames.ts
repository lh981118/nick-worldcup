type TeamLike = {
  id: string;
  name_en: string;
  name_es: string;
};

const TEAM_ZH: Record<string, string> = {
  ESP: '西班牙',
  ARG: '阿根廷',
  FRA: '法国',
  BRA: '巴西',
  POR: '葡萄牙',
  ENG: '英格兰',
  NED: '荷兰',
  BEL: '比利时',
  GER: '德国',
  CRO: '克罗地亚',
  COL: '哥伦比亚',
  URU: '乌拉圭',
  MAR: '摩洛哥',
  SUI: '瑞士',
  SEN: '塞内加尔',
  JPN: '日本',
  USA: '美国',
  MEX: '墨西哥',
  ECU: '厄瓜多尔',
  KOR: '韩国',
  IRN: '伊朗',
  AUS: '澳大利亚',
  EGY: '埃及',
  PAR: '巴拉圭',
  ALG: '阿尔及利亚',
  AUT: '奥地利',
  TUR: '土耳其',
  CIV: '科特迪瓦',
  TUN: '突尼斯',
  NOR: '挪威',
  SWE: '瑞典',
  SCO: '苏格兰',
  CAN: '加拿大',
  CZE: '捷克',
  BIH: '波黑',
  GHA: '加纳',
  QAT: '卡塔尔',
  KSA: '沙特阿拉伯',
  RSA: '南非',
  COD: '刚果民主共和国',
  UZB: '乌兹别克斯坦',
  JOR: '约旦',
  IRQ: '伊拉克',
  CPV: '佛得角',
  CUW: '库拉索',
  NZL: '新西兰',
  PAN: '巴拿马',
  HAI: '海地',
};

const STAGE_ZH: Record<string, string> = {
  r32: '32 强',
  r16: '16 强',
  qf: '8 强',
  sf: '半决赛',
  final: '决赛',
  champ: '冠军',
  champion: '冠军',
  runnerUp: '亚军',
  third: '季军',
  fourth: '第四名',
  group: '小组赛',
};

export function teamDisplayName(team: TeamLike, locale: string) {
  if (locale === 'zh') return TEAM_ZH[team.id] ?? team.name_en;
  if (locale === 'es') return team.name_es;
  return team.name_en;
}

export function teamNameById(
  teamId: string,
  locale: string,
  teams: TeamLike[]
) {
  const team = teams.find((item) => item.id === teamId);
  return team ? teamDisplayName(team, locale) : teamId;
}

export function stageDisplayName(stage: string, locale: string) {
  if (locale === 'zh') return STAGE_ZH[stage] ?? stage;
  return stage;
}
