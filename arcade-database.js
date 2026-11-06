const defaultProfile={name:'路过的同学',mascot:'panda'};

export const mascots=[
  {
    id:'pig',baseName:'猪',name:'猪',emoji:'🐷',
    attackSkill:{name:'神猪天降重压',icon:'🐷',damage:30,desc:'肥美神猪从天而降，造成30点暴击压杀！'},
    forms:[
      {name:'小猪仔',emoji:'🐷',motto:'快乐加倍，烦恼减半。'},
      {name:'飞天猪',emoji:'🐗',motto:'插上梦想翅膀，快乐起飞。'},
      {name:'黄金脆皮猪',emoji:'🥓',motto:'全班顶流金猪，香气四溢。'},
      {name:'赛博机械猪',emoji:'🤖',motto:'赛博飞天神猪，代码零Bug！'},
      {name:'霸天战神猪',emoji:'⚔️',motto:'身披重铠，威风凛凛冲锋在前！'},
      {name:'创世神猪尊',emoji:'👑',motto:'万猪之祖，降下无尽祥瑞与好运！'}
    ]
  },
  {
    id:'turtle',baseName:'甲鱼',name:'甲鱼',emoji:'🐢',
    attackSkill:{name:'玄武金刚螺旋',icon:'🥷',damage:30,desc:'缩入金刚硬壳高速螺旋撞击，造成30点穿甲伤害！'},
    forms:[
      {name:'小甲鱼',emoji:'🐢',motto:'不慌不忙，也在向前。'},
      {name:'旋风忍者甲鱼',emoji:'🥷',motto:'看似慢吞吞，实则身手不凡。'},
      {name:'万年龙龟',emoji:'🐉',motto:'稳如泰山，见证岁月沉淀。'},
      {name:'宇宙玄武',emoji:'✨',motto:'星空守护神，稳坐前茅！'},
      {name:'金刚不坏玄龟',emoji:'🛡️',motto:'绝对防御，反震万物攻击！'},
      {name:'洪荒镇海神龟',emoji:'🌊',motto:'背负仙山，定海安澜威震八荒！'}
    ]
  },
  {
    id:'chicken',baseName:'鸡',name:'鸡',emoji:'🐔',
    attackSkill:{name:'只因天雷暴击',icon:'⚡',damage:35,desc:'唱跳rap篮球合一，降下只因紫霄神雷造成35点毁灭伤害！'},
    forms:[
      {name:'练习生雏鸡',emoji:'🐥',motto:'元气上线，练习时长刚满两天半。'},
      {name:'中分背带鸡',emoji:'🐔',motto:'梳中分头、背带裤，雄鸡一唱代码全绿。'},
      {name:'唱跳霸王鸡',emoji:'🕺',motto:'掌握铁山靠，巅峰产生虚伪的拥护！'},
      {name:'绝顶篮球鸡',emoji:'🏀',motto:'指尖旋转乾坤，运球突破一切困难！'},
      {name:'破晓斗战神鸡',emoji:'⚡',motto:'金鸡报晓雷霆动，全场热血沸腾！'},
      {name:'只因神尊·IKUN',emoji:'👑',motto:'黄昏见证虔诚的信徒，全宇宙光芒万丈！'}
    ]
  },
  {
    id:'cat',baseName:'野猫',name:'野猫',emoji:'🐈',
    attackSkill:{name:'绝影幻影九连爪',icon:'🐾',damage:30,desc:'化身鬼魅残影连环挥出猫猫利爪，造成30点迅捷伤害！'},
    forms:[
      {name:'软萌奶猫',emoji:'🐱',motto:'自由探索，好奇不打烊。'},
      {name:'街头霸王猫',emoji:'🐈',motto:'巡视校园，霸气外露。'},
      {name:'招财玄猫',emoji:'🐈‍⬛',motto:'灵性通玄，代码全绿。'},
      {name:'绝影疾风猫',emoji:'🌪️',motto:'踏风而行，行踪神出鬼没。'},
      {name:'幽冥夜影猫',emoji:'🐾',motto:'隐匿于夜色，一击必中。'},
      {name:'喵星大魔王',emoji:'👑',motto:'全宇宙统治者，猫生无敌赢家！'}
    ]
  },
  {
    id:'owl',baseName:'猫头鹰',name:'猫头鹰',emoji:'🦉',
    attackSkill:{name:'奥术星界冲击波',icon:'🔮',damage:30,desc:'双眼射出高数与逻辑奥术光束，造成30点精神暴击！'},
    forms:[
      {name:'大眼雏鹰',emoji:'🦉',motto:'灵感在线，陪你找到答案。'},
      {name:'夜读学者鹰',emoji:'📚',motto:'熬夜敲码，灵感迸发。'},
      {name:'魔法智者鹰',emoji:'🧙',motto:'通晓百家，玄学Debug大师。'},
      {name:'时空之眼',emoji:'🔮',motto:'双眸洞察万物，指引前路！'},
      {name:'奥术贤者大宗师',emoji:'📜',motto:'解析宇宙法则，掌控数据洪流。'},
      {name:'洞悉万物天眼尊',emoji:'🌌',motto:'看透一切算法与未来，智慧至高无上！'}
    ]
  },
  {
    id:'dog',baseName:'狗',name:'狗',emoji:'🐶',
    attackSkill:{name:'天狗啸月破空咬',icon:'🐺',damage:30,desc:'引动月之神力狂暴撕咬，造成30点忠诚守护伤害！'},
    forms:[
      {name:'摇尾奶狗',emoji:'🐶',motto:'一路相伴，快乐有同伙。'},
      {name:'元气柯基',emoji:'🐕',motto:'短腿飞奔，热情不减。'},
      {name:'护班战犬',emoji:'🦮',motto:'风雨无阻，守护全班。'},
      {name:'烈焰魔犬',emoji:'🐾',motto:'赤焰奔腾，忠心护主。'},
      {name:'破风狼皇',emoji:'🐺',motto:'群狼之首，号令风雪。'},
      {name:'神犬啸天',emoji:'⚡',motto:'神雷护体啸震寰宇，同窗义气拉满！'}
    ]
  },
  {
    id:'panda',baseName:'熊猫',name:'熊猫',emoji:'🐼',
    attackSkill:{name:'国宝降龙十八掌',icon:'🥋',damage:30,desc:'打出金光闪闪的大熊猫掌风，造成30点国宝级重击！'},
    forms:[
      {name:'滚滚糯米糍',emoji:'🐼',motto:'今天也要，抱抱自己。'},
      {name:'功夫熊猫',emoji:'🥋',motto:'行云流水，深藏不露。'},
      {name:'翠竹仙人',emoji:'🎋',motto:'悠然自得，气定神闲。'},
      {name:'祥瑞国宝尊',emoji:'🎖️',motto:'万千宠爱，全班永恒团宠！'},
      {name:'混元太极仙尊',emoji:'☯️',motto:'阴阳相济，以柔克刚通天地。'},
      {name:'万佛朝宗神圣大熊猫',emoji:'👑',motto:'佛光普照，全班永恒至高无上萌主！'}
    ]
  },
  {
    id:'rednose',baseName:'小丑先生',name:'小丑先生',emoji:'👦',image:'/assets/rednose-classmate.svg',
    attackSkill:{name:'奇迹魔术大爆炸',icon:'🎪',damage:30,desc:'掷出万花筒礼帽引爆漫天彩带与白鸽，造成30点浪漫暴击！'},
    forms:[
      {name:'小丑先生',emoji:'👦',image:'/assets/rednose-classmate.svg',motto:'鼻尖一点红，同窗一起笑。'},
      {name:'戏法大师小丑先生',emoji:'🎩',image:'/assets/rednose-classmate.svg',motto:'礼帽变白鸽，欢笑洒满堂。'},
      {name:'狂欢魔术师小丑先生',emoji:'🎪',image:'/assets/rednose-classmate.svg',motto:'舞台中央，带来奇迹与浪漫。'},
      {name:'欢乐守护神小丑先生',emoji:'✨',image:'/assets/rednose-classmate.svg',motto:'红鼻闪耀，愿青春永不谢幕！'},
      {name:'梦幻巡游造梦者',emoji:'🎈',image:'/assets/rednose-classmate.svg',motto:'气球飞扬，带全班飞向童话世界。'},
      {name:'永恒欢笑造物神',emoji:'🎭',image:'/assets/rednose-classmate.svg',motto:'让每一个悲伤消散，快乐永不落幕！'}
    ]
  },
  {
    id:'hippo',baseName:'河马',name:'河马',emoji:'🦛',
    attackSkill:{name:'滔天巨浪吞噬撞',icon:'🌊',damage:30,desc:'张开深渊巨口掀起海啸狂澜，造成30点狂暴水击！'},
    forms:[
      {name:'小河马',emoji:'🦛',motto:'小泥巴团，水里冒泡泡。'},
      {name:'大嘴河马',emoji:'🫧',motto:'深渊巨口，吞掉所有烦恼。'},
      {name:'铁甲河马',emoji:'🛡️',motto:'皮糙肉厚，防御力破表。'},
      {name:'碧波巨兽河马',emoji:'🌊',motto:'水下霸主，激起快乐浪花！'},
      {name:'翻江撼地狂兽',emoji:'💥',motto:'重踏大地，江河翻滚为之战栗。'},
      {name:'深海泰坦河马神',emoji:'🐋',motto:'体魄浩瀚如深海，庇佑全班无坚不摧！'}
    ]
  },
  {
    id:'horse',baseName:'马',name:'马',emoji:'🐴',
    attackSkill:{name:'赤兔奔雷连环踏',icon:'🐎',damage:30,desc:'四蹄裹挟赤色烈火奔雷连环践踏，造成30点神驹冲踏伤害！'},
    forms:[
      {name:'小马驹',emoji:'🐴',motto:'蹄声轻快，对世界充满好奇。'},
      {name:'疾风烈马',emoji:'🐎',motto:'追风逐日，纵横驰骋。'},
      {name:'独角天马',emoji:'🦄',motto:'圣洁双翼，踏云而行。'},
      {name:'赤兔龙驹',emoji:'⚡',motto:'千里神驹，奔向无限前程！'},
      {name:'踏云圣龙驹',emoji:'🐉',motto:'龙首马身，纵横九天十地。'},
      {name:'纵横银河天帝马',emoji:'🌌',motto:'踏碎星汉，驰骋宇宙无拘无束！'}
    ]
  },
  {
    id:'donkeycat',baseName:'驴猫',name:'驴猫',emoji:'🫏',
    attackSkill:{name:'混元霹雳后旋蹬',icon:'🫏',damage:30,desc:'驴耳一竖、猫腰一拧踢出混元霹雳后旋蹬，造成30点倔强暴击！'},
    forms:[
      {name:'驴猫宝宝',emoji:'🫏',motto:'驴耳配黑眼圈，呆萌又倔强。'},
      {name:'功夫驴猫',emoji:'🐼',motto:'倔驴脾气配猫猫拳，谁惹踢谁。'},
      {name:'祥瑞驴猫仙',emoji:'🎋',motto:'一边啃竹子一边拉磨，全班最勤奋。'},
      {name:'宇宙混元驴猫',emoji:'🌌',motto:'跨界奇迹，毅力与萌力巅峰！'},
      {name:'阴阳太极驴猫祖',emoji:'☯️',motto:'跨界太极，无招胜有招。'},
      {name:'无敌破壁圣驴猫',emoji:'👑',motto:'打破物种界限，创造属于25计1的传奇！'}
    ]
  },
  {
    id:'wuba',baseName:'胡巴',name:'胡巴',emoji:'🌱',
    attackSkill:{name:'万妖怒涛水龙卷',icon:'👑',damage:30,desc:'小嘴一鼓喷射超高压水龙卷，造成30点萌妖水系暴击！'},
    forms:[
      {name:'小萝卜',emoji:'🌱',motto:'刚破土而出的小青萝卜，嫩生生的。'},
      {name:'萝卜头',emoji:'🥕',motto:'长出手脚摇头晃脑，到处找水喝。'},
      {name:'萌妖胡巴',emoji:'👶',motto:'Wuba Wuba~ 吐水小妖王诞生！'},
      {name:'妖界至尊胡巴',emoji:'👑',motto:'神仙胡巴，法力无边佑全班好运！'},
      {name:'天地万灵妖皇',emoji:'🌊',motto:'万灵俯首，号令四海八荒萌妖。'},
      {name:'鸿蒙始祖圣胡巴',emoji:'✨',motto:'鸿蒙化身，给全班带来永恒生机与福气！'}
    ]
  },
  {
    id:'triangle',baseName:'三角形',name:'三角形',emoji:'📐',
    attackSkill:{name:'次元三棱绝对切割',icon:'📐',damage:35,desc:'调动几何公理与三棱晶体光速切割，造成35点绝对几何真实伤害！'},
    forms:[
      {name:'小三角',emoji:'📐',motto:'锐角尖尖，三点成面最稳固。'},
      {name:'黄金正三角',emoji:'🔺',motto:'三边对称，棱角分明不服输。'},
      {name:'百慕大魔幻三角',emoji:'🛕',motto:'神秘力场，吸走所有bug与烦恼。'},
      {name:'宇宙三棱镜',emoji:'🌈',motto:'折射无限光谱，折射璀璨未来！'},
      {name:'超维几何棱镜',emoji:'💠',motto:'四维投影，构筑无法打破的立体壁垒。'},
      {name:'绝对真理全知三角',emoji:'🔮',motto:'数学与宇宙的终极真理，构筑永恒基石！'}
    ]
  },
  {
    id:'beetle',baseName:'屎壳郎',name:'屎壳郎',emoji:'🪲',
    attackSkill:{name:'创世神球陨石坠',icon:'☀️',damage:35,desc:'推起星核陨石从外太空砸下，造成35点震撼天地的爆炸伤害！'},
    forms:[
      {name:'小屎球推手',emoji:'🪲',motto:'勤劳推球，默默蓄力不言弃。'},
      {name:'黄金圣甲虫',emoji:'🪞',motto:'金甲闪烁，低调奢华有内涵。'},
      {name:'星空滚球兽',emoji:'🪐',motto:'推起星辰大海，宇宙皆为掌中球。'},
      {name:'创世太阳圣甲虫',emoji:'☀️',motto:'推动初升骄阳，照亮25计1全班未来！'},
      {name:'银河引力主宰者',emoji:'🌌',motto:'掌管星系引力，聚沙成塔扭转乾坤。'},
      {name:'恒星创生神圣甲虫',emoji:'🌟',motto:'推动宇宙大爆炸的核心原点，点亮不朽文明！'}
    ]
  },
  {
    id:'shoe',baseName:'鞋子',name:'鞋子',emoji:'👟',
    attackSkill:{name:'黄金切尔西破颜踢',icon:'👞',damage:35,desc:'英雄可以受委屈，但不能踩切尔西！踢出35点暴怒破颜伤害！'},
    forms:[
      {name:'破布草鞋',emoji:'👟',motto:'千里之行，始于足下。踏破泥泞无所畏惧。'},
      {name:'滑板板鞋',emoji:'🛹',motto:'摩擦摩擦，在这光滑的地上摩擦前进。'},
      {name:'暴走飞天神鞋',emoji:'🪽',motto:'一步登天，摆脱地心引力的束缚。'},
      {name:'黄金切尔西',emoji:'👞',motto:'英雄可以受委屈，但不能踩我的切尔西！'},
      {name:'瞬移风火轮神靴',emoji:'⚡',motto:'踏破虚空，瞬息千里，上课绝不迟到。'},
      {name:'灭世飞履·至尊切尔西',emoji:'👑',motto:'金光耀世，一脚踢爆所有的Bug与脱发烦恼！'}
    ]
  },
  {
    id:'oil',baseName:'油',name:'油',emoji:'🛢️',
    attackSkill:{name:'烈焰机油大爆燃',icon:'🛢️',damage:35,desc:'倾倒高能航空机油引燃烈焰火海，造成35点炽热爆燃伤害！'},
    forms:[
      {name:'晶莹小油滴',emoji:'💧',motto:'顺滑如丝，无孔不入，润物细无声。'},
      {name:'特级冷榨香油',emoji:'🫒',motto:'滴滴香浓，给同学们的课间加点香味。'},
      {name:'火箭高能航空燃油',emoji:'⛽',motto:'热血沸腾，满载千吨推力直冲云霄！'},
      {name:'极速抗磨超跑机油',emoji:'🏎️',motto:'降噪散热，零阻力全速飙向璀璨未来。'},
      {name:'赛博流体超导液',emoji:'🧪',motto:'超导零阻抗，代码以光速瞬间执行。'},
      {name:'永恒炽热能量原油',emoji:'☀️',motto:'全宇宙的核心动力源泉，永不枯竭，熊熊燃烧！'}
    ]
  },
  {
    id:'liubang',baseName:'刘邦',name:'刘邦',emoji:'👑',image:'/assets/liubang-1.jpg',
    attackSkill:{name:'赤霄神剑斩白蛇',icon:'🗡️',damage:40,desc:'拔出三尺赤霄神剑斩断白蛇，造成40点帝王至尊伤害！'},
    forms:[
      {name:'泗水亭长刘季',emoji:'👑',image:'/assets/liubang-1.jpg',motto:'【双面君主】不拘小节，仗义疏财，结交天下豪杰。'},
      {name:'斩蛇起义沛公',emoji:'⚔️',image:'/assets/liubang-2.jpg',motto:'【圣殿之光】金甲圣光护体，拔剑斩白蛇，顺天应人破秦关。'},
      {name:'约法三章汉王',emoji:'🗡️',image:'/assets/liubang-3.jpg',motto:'【剑破天穹】青锋破空剑气如虹，除苛法抚黎民，聚四海人心。'},
      {name:'垓下决胜汉高帝',emoji:'📜',image:'/assets/liubang-4.jpg',motto:'【妙算神机】运筹帷幄之中，四面楚歌定乾坤，汉家威名传万古。'},
      {name:'大风起兮真龙天子',emoji:'🧭',image:'/assets/liubang-5.jpg',motto:'【夺宝奇兵】秘宝神钥在手，大风起兮云飞扬，威加海内兮归故乡！'},
      {name:'万古汉魂·汉高祖神尊',emoji:'👑',image:'/assets/liubang-1.jpg',motto:'【五位一体】安得猛士兮守四方！护佑 25计算机1班 威震四海！'}
    ]
  },
  {
    id:'toe',baseName:'脚趾头',name:'脚趾头',emoji:'🦶',
    attackSkill:{name:'抠出三室一厅',icon:'🦶',baseDamage:25,damage:25,desc:'当场脚趾抠地抠出三室一厅，造成巨额破防伤害！'},
    forms:[
      {name:'小脚丫',emoji:'🦶',motto:'白白嫩嫩，迈出探索世界第一步。'},
      {name:'灵动大脚趾',emoji:'👣',motto:'灵活有力，走路带风。'},
      {name:'人字拖狂战士',emoji:'🩴',motto:'穿上人字拖，迈出六亲不认的霸气步伐。'},
      {name:'黄金大脚趾',emoji:'✨',motto:'脚踏祥云，步步生莲，威风凛凛！'},
      {name:'抠地狂魔脚趾皇',emoji:'🏰',motto:'尴尬力爆棚，当场抠出一座紫禁城！'},
      {name:'踏碎虚空·创世圣脚',emoji:'👑',motto:'一脚定乾坤，踏平前方所有坎坷与Bug！'}
    ]
  },
  {
    id:'arowana',baseName:'龙鱼',name:'龙鱼',emoji:'🐠',
    attackSkill:{name:'金龙摆尾翻江浪',icon:'🌊',baseDamage:25,damage:25,desc:'金鳞耀目，巨尾拍出千层惊涛骇浪，造成巨额祥瑞水瀑伤害！'},
    forms:[
      {name:'小银龙鱼',emoji:'🐟',motto:'灵动游弋，银光闪烁。'},
      {name:'红尾金龙',emoji:'🐠',motto:'金鳞初显，富贵吉祥。'},
      {name:'极品过背金龙',emoji:'✨',motto:'金光贯顶，满缸瑞气迎门。'},
      {name:'招财化龙鱼',emoji:'🐉',motto:'鱼跃龙门，身聚万千气运！'},
      {name:'九霄金鳞龙皇',emoji:'👑',motto:'翱翔九天，福泽庇佑全班！'},
      {name:'鸿蒙始祖太皇龙鱼',emoji:'🌌',motto:'真龙降世，气吞万里如虎！'}
    ]
  },
  {
    id:'squirtle',baseName:'杰尼龟',name:'杰尼龟',emoji:'🐢',
    attackSkill:{name:'水炮墨镜铁头功',icon:'💧',baseDamage:25,damage:25,desc:'戴上黑色墨镜，射出超高压水炮与铁头撞击！'},
    forms:[
      {name:'小杰尼龟',emoji:'🐢',motto:'圆圆脑袋，杰尼杰尼~'},
      {name:'墨镜杰尼龟',emoji:'🕶️',motto:'戴上墨镜，杰尼军团霸气登场。'},
      {name:'卡咪龟',emoji:'🌊',motto:'耳朵尾巴长出羽毛，水波荡漾。'},
      {name:'钢铁水炮水箭龟',emoji:'💥',motto:'背负双联高压水炮，轰穿一切阻碍！'},
      {name:'超级水箭龟',emoji:'🛡️',motto:'三管巨炮合一，海啸连环轰炸！'},
      {name:'极巨化灭世水神龟',emoji:'👑',motto:'汪洋主宰，无坚不摧的水系霸王！'}
    ]
  },
  {
    id:'buckteeth',baseName:'兔子牙',name:'兔子牙',emoji:'🦷',
    attackSkill:{name:'暴风超能大门牙',icon:'🐰',baseDamage:25,damage:25,desc:'两颗闪闪发光的大门牙闪电连环狂啃，造成疯狂破壳暴击！'},
    forms:[
      {name:'两颗大门牙',emoji:'🦷',motto:'白白净净，啃胡萝卜嘎嘣脆。'},
      {name:'萌萌兔牙仔',emoji:'🐰',motto:'咧嘴一笑露出两颗大门牙，萌翻全场。'},
      {name:'碎核狂暴兔牙',emoji:'🥕',motto:'无坚不摧，坚果钢板照啃不误。'},
      {name:'钻石闪光大门牙',emoji:'💎',motto:'闪闪发光亮瞎全场，硬度超越钻石！'},
      {name:'破法超能兔神牙',emoji:'⚡',motto:'两道闪电门牙一合，啃碎一切系统Bug！'},
      {name:'吞天噬地·至尊乾坤牙',emoji:'👑',motto:'万物皆可嚼碎，两颗神牙镇乾坤！'}
    ]
  }
];

export const arcadeSchema=[
  'CREATE TABLE IF NOT EXISTS class_arcade_profiles(owner TEXT PRIMARY KEY,name TEXT NOT NULL,mascot TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS class_arcade_feeds(day TEXT NOT NULL,owner TEXT NOT NULL,mascot TEXT NOT NULL,PRIMARY KEY(day,owner,mascot))',
  'CREATE INDEX IF NOT EXISTS class_arcade_feeds_mascot ON class_arcade_feeds(mascot)',
  'CREATE TABLE IF NOT EXISTS class_arcade_attempts(id TEXT PRIMARY KEY,owner TEXT NOT NULL,rounds TEXT NOT NULL,score INTEGER NOT NULL,day TEXT NOT NULL,date TEXT NOT NULL,revoked INTEGER NOT NULL DEFAULT 0)',
  'CREATE INDEX IF NOT EXISTS class_arcade_attempts_owner_day ON class_arcade_attempts(owner,day)',
  'CREATE TABLE IF NOT EXISTS class_arcade_scores(owner TEXT PRIMARY KEY,id TEXT NOT NULL UNIQUE,score INTEGER NOT NULL,date TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS class_arcade_tickets(owner TEXT PRIMARY KEY,ticket TEXT NOT NULL UNIQUE,choices TEXT NOT NULL,expires_at BIGINT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS class_arcade_drawings(id TEXT PRIMARY KEY,owner TEXT NOT NULL,name TEXT NOT NULL,answer TEXT NOT NULL,hint TEXT NOT NULL,strokes TEXT NOT NULL,fingerprint TEXT NOT NULL,deleted INTEGER NOT NULL DEFAULT 0,date TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS class_arcade_drawings_date ON class_arcade_drawings(deleted,date)',
  'CREATE TABLE IF NOT EXISTS class_arcade_guesses(drawing TEXT NOT NULL,owner TEXT NOT NULL,misses INTEGER NOT NULL,last_try BIGINT NOT NULL,solved INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(drawing,owner))'
];

export function arcadeStore(query){
  const rows=async(sql,args=[])=>(await query(sql,args)).rows;
  const profile=async owner=>(await rows('SELECT name,mascot FROM class_arcade_profiles WHERE owner=$1',[owner]))[0]||{...defaultProfile};
  const mapDrawing=row=>({id:row.id,name:row.name,hint:row.hint,length:Number(row.word_length),solvedCount:Number(row.solved_count),mine:!!row.mine,solved:!!row.solved,answer:row.answer,createdAt:row.date});
  const drawingColumns="d.id,d.name,d.hint,d.date,LENGTH(d.answer) AS word_length,CASE WHEN d.owner=$1 THEN 1 ELSE 0 END AS mine,COALESCE(g.solved,0) AS solved,CASE WHEN d.owner=$1 OR g.solved=1 THEN d.answer ELSE NULL END AS answer,(SELECT COUNT(*) FROM class_arcade_guesses count_guess WHERE count_guess.drawing=d.id AND count_guess.solved=1) AS solved_count";
  const scores=async owner=>(await rows("SELECT s.id,COALESCE(p.name,'路过的同学') AS name,COALESCE(p.mascot,'panda') AS mascot,s.score,CASE WHEN s.owner=$1 THEN 1 ELSE 0 END AS mine FROM class_arcade_scores s LEFT JOIN class_arcade_profiles p ON p.owner=s.owner ORDER BY s.score ASC,s.date ASC,s.id ASC LIMIT 20",[owner])).map(s=>({...s,score:Number(s.score),mine:!!s.mine}));

  return {
    arcadeProfile:profile,
    async arcadeCleanup(day,now){await query('DELETE FROM class_arcade_attempts WHERE day<$1 AND revoked=0',[day]);await query('DELETE FROM class_arcade_tickets WHERE expires_at<$1',[now])},
    arcadeSaveProfile:(owner,name,mascot)=>query('INSERT INTO class_arcade_profiles(owner,name,mascot) VALUES($1,$2,$3) ON CONFLICT(owner) DO UPDATE SET name=excluded.name,mascot=excluded.mascot',[owner,name,mascot]),
    arcadeFeed:(day,owner,mascot)=>query('INSERT INTO class_arcade_feeds(day,owner,mascot) VALUES($1,$2,$3) ON CONFLICT(day,owner,mascot) DO NOTHING',[day,owner,mascot]),
    async arcadeState(owner,day){
      const [me,totals,fed,best,reactionLeaderboard,drawings,settingsRows]=await Promise.all([
        profile(owner),rows('SELECT mascot,COUNT(*) AS n FROM class_arcade_feeds GROUP BY mascot'),
        rows('SELECT mascot FROM class_arcade_feeds WHERE day=$1 AND owner=$2',[day,owner]),
        rows('SELECT score FROM class_arcade_scores WHERE owner=$1',[owner]),scores(owner),
        rows('SELECT '+drawingColumns+' FROM class_arcade_drawings d LEFT JOIN class_arcade_guesses g ON g.drawing=d.id AND g.owner=$1 WHERE d.deleted=0 ORDER BY d.date DESC,d.id DESC LIMIT 100',[owner]),
        rows("SELECT key,value FROM class_settings WHERE key IN ('mascot_battle_stats','mascot_battle_logs')")
      ]);
      let stats={},battleLogs=[];
      try{stats=JSON.parse(settingsRows.find(r=>r.key==='mascot_battle_stats')?.value||'{}')}catch{}
      try{battleLogs=JSON.parse(settingsRows.find(r=>r.key==='mascot_battle_logs')?.value||'[]')}catch{}
      if(!Array.isArray(battleLogs))battleLogs=[];
      const penalties=stats.feedPenalties||{};
      const hitsMap=stats.hitsReceived||{};
      const todayAttacksMap=(stats.attacksToday||{})[day]||{};
      const pets=mascots.map(m=>{
        const rawFeeds=Number(totals.find(t=>t.mascot===m.id)?.n||0);
        const penalty=Math.max(0,Number(penalties[m.id]||0));
        const feeds=Math.max(0,rawFeeds-penalty);
        const formIdx=Math.min(m.forms.length-1,Math.floor(feeds/10));
        const currentForm=m.forms[formIdx];
        const nextForm=m.forms[formIdx+1]||null;
        const level=1+formIdx;
        const isMaxLevel=formIdx>=m.forms.length-1;
        const canAttack=level>=4;
        const todayAttacks=Number(todayAttacksMap[m.id]||0);
        const remainingAttacks=Math.max(0,3-todayAttacks);
        const hitsReceived=Number(hitsMap[m.id]||0);
        const baseDamage=m.attackSkill?.baseDamage||m.attackSkill?.damage||25;
        const levelBonus=Math.max(0,level-4)*10;
        const damage=baseDamage+levelBonus;
        return {
          id:m.id,
          baseName:m.baseName,
          name:currentForm.name,
          emoji:currentForm.emoji,
          image:currentForm.image||m.image,
          motto:currentForm.motto,
          feeds,
          rawFeeds,
          formIndex:formIdx,
          level,
          isMaxLevel,
          canAttack,
          maxLevel:m.forms.length,
          skill:m.attackSkill?{...m.attackSkill,baseDamage,levelBonus,damage}:null,
          progress:isMaxLevel?10:feeds%10,
          needed:10,
          fed:fed.some(f=>f.mascot===m.id),
          forms:m.forms,
          nextForm:nextForm?nextForm.name:null,
          todayAttacks,
          remainingAttacks,
          hitsReceived,
          hitsNeeded:3
        };
      });
      return {day,pets,battleLogs,my:{...me,stickerCount:fed.length,bestReaction:best[0]?Number(best[0].score):null},reactionLeaderboard,drawings:drawings.map(mapDrawing)};
    },
    async arcadeReaction(p){
      await query('INSERT INTO class_arcade_attempts(id,owner,rounds,score,day,date) SELECT $1,$2,$3,$4,$5,$6 WHERE (SELECT COUNT(*) FROM class_arcade_attempts WHERE owner=$2 AND day=$5)<30 ON CONFLICT(id) DO NOTHING',[p.id,p.owner,JSON.stringify(p.rounds),p.score,p.day,p.date]);
      const existing=(await rows('SELECT owner,rounds,score,revoked FROM class_arcade_attempts WHERE id=$1',[p.id]))[0];
      if(!existing)return 'limit';if(existing.owner!==p.owner||existing.rounds!==JSON.stringify(p.rounds))return 'conflict';
      if(existing.revoked)return 'revoked';
      await query('INSERT INTO class_arcade_scores(owner,id,score,date) SELECT $1,$2,$3,$4 WHERE EXISTS(SELECT 1 FROM class_arcade_attempts WHERE id=$5 AND owner=$1 AND revoked=0) ON CONFLICT(owner) DO UPDATE SET score=excluded.score,date=excluded.date WHERE excluded.score<class_arcade_scores.score',[p.owner,p.scoreId,Number(existing.score),p.date,p.id]);
      return 'ok';
    },
    arcadeTicket:async(owner,ticket)=>(await rows('SELECT ticket,choices,expires_at FROM class_arcade_tickets WHERE owner=$1'+(ticket?' AND ticket=$2':''),ticket?[owner,ticket]:[owner]))[0],
    arcadeSaveTicket:(owner,ticket,choices,expires)=>query('INSERT INTO class_arcade_tickets(owner,ticket,choices,expires_at) VALUES($1,$2,$3,$4) ON CONFLICT(owner) DO UPDATE SET ticket=excluded.ticket,choices=excluded.choices,expires_at=excluded.expires_at',[owner,ticket,JSON.stringify(choices),expires]),
    arcadeRawDrawing:async id=>(await rows('SELECT * FROM class_arcade_drawings WHERE id=$1',[id]))[0],
    async arcadeCreateDrawing(p){return !!(await query('INSERT INTO class_arcade_drawings(id,owner,name,answer,hint,strokes,fingerprint,date) SELECT $1,$2,$3,$4,$5,$6,$7,$8 WHERE (SELECT COUNT(*) FROM class_arcade_drawings WHERE deleted=0)<100 AND (SELECT COUNT(*) FROM class_arcade_drawings WHERE owner=$2 AND deleted=0)<5 ON CONFLICT(id) DO NOTHING',[p.id,p.owner,p.name,p.answer,p.hint,JSON.stringify(p.strokes),p.fingerprint,p.date])).rowCount},
    async arcadeDrawing(id,owner){const row=(await rows('SELECT '+drawingColumns+',d.strokes FROM class_arcade_drawings d LEFT JOIN class_arcade_guesses g ON g.drawing=d.id AND g.owner=$1 WHERE d.id=$2 AND d.deleted=0',[owner,id]))[0];return row?{...mapDrawing(row),strokes:JSON.parse(row.strokes)}:null},
    arcadeGuessState:async(id,owner)=>(await rows('SELECT misses,last_try,solved FROM class_arcade_guesses WHERE drawing=$1 AND owner=$2',[id,owner]))[0],
    async arcadeRecordGuess(id,owner,correct,now){return !!(await query("INSERT INTO class_arcade_guesses(drawing,owner,misses,last_try,solved) SELECT id,$1,$2,$3,$4 FROM class_arcade_drawings WHERE id=$5 AND owner<>$1 AND deleted=0 ON CONFLICT(drawing,owner) DO UPDATE SET misses=class_arcade_guesses.misses+excluded.misses,last_try=excluded.last_try,solved=excluded.solved WHERE class_arcade_guesses.solved=0 AND class_arcade_guesses.misses<20 AND class_arcade_guesses.last_try<=$6",[owner,correct?0:1,now,correct?1:0,id,now-1000])).rowCount},
    arcadeSolvedCount:async id=>Number((await rows('SELECT COUNT(*) AS n FROM class_arcade_guesses WHERE drawing=$1 AND solved=1',[id]))[0]?.n||0),
    async arcadeDeleteDrawing(id,owner){return !!(await query("UPDATE class_arcade_drawings SET deleted=1,strokes='[]' WHERE id=$1 AND deleted=0"+(owner===undefined?'':' AND owner=$2'),owner===undefined?[id]:[id,owner])).rowCount},
    async arcadeAdmin(){return {drawings:(await rows('SELECT d.id,d.name,d.answer,d.hint,d.date,(SELECT COUNT(*) FROM class_arcade_guesses g WHERE g.drawing=d.id AND g.solved=1) AS solved_count FROM class_arcade_drawings d WHERE d.deleted=0 ORDER BY d.date DESC,d.id DESC')).map(d=>({id:d.id,name:d.name,answer:d.answer,hint:d.hint,createdAt:d.date,solvedCount:Number(d.solved_count)})),scores:await scores('')}},
    async arcadeDeleteScore(id){await query('UPDATE class_arcade_attempts SET revoked=1 WHERE owner=(SELECT owner FROM class_arcade_scores WHERE id=$1)',[id]);return query('DELETE FROM class_arcade_scores WHERE id=$1',[id])}
  };
}
