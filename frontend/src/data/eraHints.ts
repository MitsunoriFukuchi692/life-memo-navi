// ============================================================
// 時代ヒントデータ（自分史・会社史・終活ノート用）
// 各質問IDに対応した「その頃の時代の出来事」ヒント集
// ============================================================

export interface EraHint {
  decade: string;        // 例: "1950年代"
  topics: string[];      // 勉学・芸能・社会・流行など
}

// 年代別の時代ヒント（西暦ベース）
export const ERA_HINTS: Record<number, EraHint> = {
  1930: { decade: 'The 1930s', topics: ['📻 Radio became a shared family experience.', '🏫 School and community life were very different from today.', '🌾 Many families were close to agriculture and local trades.'] },
  1940: { decade: 'The 1940s', topics: ['🕊️ War, its end, and recovery shaped daily life.', '🍚 Food shortages and rationing affected many households.', '🏫 New education systems emerged after the war.'] },
  1950: { decade: 'The 1950s', topics: ['📺 Television began to enter public life.', '🚂 Many young people moved for work and new opportunities.', '🌸 Economic recovery gradually changed everyday living.'] },
  1960: { decade: 'The 1960s', topics: ['🏅 The Tokyo Olympics symbolized a new era.', '🚄 High-speed rail and household appliances changed daily life.', '🎓 More young people entered higher education.'] },
  1970: { decade: 'The 1970s', topics: ['🌍 Expo 70 and global culture left strong impressions.', '🛢️ Oil shocks affected households and businesses.', '✈️ Travel and leisure became more common.'] },
  1980: { decade: 'The 1980s', topics: ['💿 Portable music and consumer electronics spread quickly.', '🏠 The bubble economy changed work and lifestyles.', '🎮 Home games and new media became part of youth culture.'] },
  1990: { decade: 'The 1990s', topics: ['💴 The bubble economy collapsed and work changed.', '📱 Mobile phones and the internet began spreading.', '🌍 Disasters and social change shaped public memory.'] },
  2000: { decade: 'The 2000s', topics: ['📱 Mobile internet and smartphones transformed communication.', '💻 Online communities and video platforms became everyday tools.', '🌍 Global events were easier to follow in real time.'] },
};

// 生まれ年から関連する時代ヒントを取得する
export function getEraHintsByBirthYear(birthYear: number): EraHint[] {
  const results: EraHint[] = [];
  // 生まれた年代 + 学生時代（+6〜22年）+ 社会人時代（+22〜40年）の3時代を返す
  const targetDecades = [
    Math.floor(birthYear / 10) * 10,           // 生まれた年代
    Math.floor((birthYear + 15) / 10) * 10,    // 青春時代
    Math.floor((birthYear + 30) / 10) * 10,    // 働き盛り
  ];
  const uniqueDecades = [...new Set(targetDecades)];
  for (const decade of uniqueDecades) {
    if (ERA_HINTS[decade]) results.push(ERA_HINTS[decade]);
  }
  return results;
}

// 質問ID別のヒントトピック（自分史）
export const JIBUNSHI_QUESTION_HINTS: Record<number, string[]> = {
  1: [ // 生まれた時代
    '🗺️ あなたが生まれた頃は、戦後復興や高度経済成長など大きな変化の時代でした。その頃の暮らしで覚えていることがあれば教えてください',
    '📻 その頃はラジオや街頭テレビが人々の楽しみでした。幼い頃に聞いた音楽や番組の記憶はありますか？',
    '🍚 当時は食べ物も今とずいぶん違いました。子どもの頃、食卓によく出ていた料理や懐かしい味はありますか？',
  ],
  2: [ // 生まれた場所・幼い頃
    '🏠 昔の家は土間や畳の部屋、縁側などがある造りが多かったですね。どんな家に住んでいましたか？',
    '👶 めんこ・石蹴り・川遊びなど、昔ならではの遊びがありましたね。近所の子どもたちとどんな遊びをしていましたか？',
    '🌾 お祭り・田植え・雪遊びなど、季節ごとの思い出は特別なものがありますね。幼い頃の季節の思い出を教えてください',
  ],
  3: [ // 家族
    '👨‍👩‍👧‍👦 昔は兄弟姉妹が多い家庭が多かったですね。ご兄弟は何人いましたか？どんな関係でしたか？',
    '👴 おじいちゃん・おばあちゃんと一緒に暮らしていた方も多い時代でした。思い出があれば教えてください',
    '🏡 農業・商売・工場など、さまざまなお仕事がありましたね。お父さん・お母さんはどんなお仕事をしていましたか？',
  ],
  4: [ // 学生時代
    '🏫 昔は先生との距離が近く、強く印象に残る先生がいたものですね。担任の先生で覚えている方はいますか？',
    '⚾ 放課後は部活や外遊びに夢中になっていた時代でした。学校でどんなことに熱中していましたか？',
    '📚 好きな科目や苦手な科目は、その後の人生にも影響することがありますね。学生時代の勉強の思い出はありますか？',
    '🎵 学校の合唱や音楽の授業で歌った曲は、今でも口ずさめるものがありますね。懐かしい曲はありますか？',
  ],
  5: [ // 最初の職場
    '🚂 集団就職や縁故採用など、今とは違う就職の形がありましたね。どうやって最初の仕事を決めましたか？',
    '💼 初めて自分で稼いだお金は特別な気持ちがしますね。初給料の時のことを覚えていますか？',
    '🏢 昔の職場は今より厳しかったり、アットホームだったり様々でしたね。最初の上司や先輩はどんな方でしたか？',
  ],
  6: [ // 大きな決断
    '💍 結婚を決めたきっかけは何でしたか？',
    '🏠 家を建てたり引っ越したりしましたか？',
    '💼 転職や独立を考えたことはありましたか？',
  ],
  7: [ // 仕事でやりがい
    '🏆 仕事で褒められたり表彰されたりした経験はありますか？',
    '👥 お客様や取引先で感謝された思い出はありますか？',
    '💡 「これを成し遂げた！」と誇りに思う仕事は何ですか？',
  ],
  8: [ // 出会った大切な人
    '👫 人生で最も影響を受けた人は誰ですか？',
    '🤝 職場や地域で長く付き合ってきた友人はいますか？',
    '💕 出会いのきっかけや、その方との思い出を教えてください',
  ],
  9: [ // 趣味・好きなこと
    '🎣 趣味はいつ頃から始めましたか？きっかけは何でしたか？',
    '📺 好きなテレビ番組・映画・本はありますか？',
    '✈️ 印象に残っている旅行の行き先はどこですか？',
  ],
  10: [ // 失敗や試練
    '😓 仕事や家庭で一番つらかった時期はいつですか？',
    '🌧️ その時、誰かに助けてもらいましたか？',
    '💪 どうやってその試練を乗り越えましたか？',
  ],
  11: [ // 学んだこと
    '📖 失敗から学んだことで、後の人生に活きたことはありますか？',
    '🌱 若い頃と今とで、考え方が変わったことはありますか？',
    '💬 自分を成長させてくれた言葉や出来事はありますか？',
  ],
  12: [ // 今大切にしていること
    '🌅 毎日の楽しみや習慣は何ですか？',
    '👨‍👩‍👧 家族や友人との時間で大切にしていることはありますか？',
    '🙏 健康のために気をつけていることはありますか？',
  ],
  13: [ // 後世代に伝えたいこと
    '📜 子どもや孫に伝えたい「人生の教え」はありますか？',
    '🌸 あなたが大切にしてきた価値観や信念は何ですか？',
    '💌 将来の世代へのメッセージを自由にどうぞ',
  ],
  14: [ // 一番幸せだった時
    '😊 人生で最高に幸せだったと感じた瞬間はいつですか？',
    '🎉 忘れられないお祝い事（結婚・出産・卒業など）はありますか？',
    '🌈 「あの時は良かったな」と今でも思い出す場面はどんな時ですか？',
  ],
  15: [ // 未来へのメッセージ
    '🌟 これからやってみたいことはありますか？',
    '💌 大切な人へ伝えたい言葉はありますか？',
    '🕊️ あなたにとって「良い人生」とはどんな人生ですか？',
  ],
};

// 会社史用のヒント
export const KAISHAISHI_QUESTION_HINTS: Record<number, string[]> = {
  1: ['💡 会社を起こしたいと思ったのはいつ頃ですか？', '👥 最初に相談した人は誰ですか？', '🌍 その頃の経済状況はどうでしたか？'],
  2: ['🏢 最初のオフィスや作業場はどんな場所でしたか？', '💼 最初の事業内容は今と同じですか？', '💰 創業資金はどうやって調達しましたか？'],
  3: ['😓 創業期で一番苦しかった時期を教えてください', '🌙 徹夜で働いた思い出はありますか？', '💪 それでも続けられた理由は何ですか？'],
  4: ['🤝 最初のお客様との出会いのエピソードを教えてください', '📞 初めて注文をもらった時の気持ちは？', '🏆 信頼関係を築くために心がけたことは何ですか？'],
  5: ['📈 売上や規模が伸びてきたと感じた瞬間はいつですか？', '👨‍💼 社員が増えてきた頃の雰囲気はどうでしたか？', '🎉 最初の大口契約の思い出はありますか？'],
  6: ['👥 特に印象に残っている社員や仲間を教えてください', '🌱 人材育成で大切にしてきたことは何ですか？', '🤝 社員への感謝の気持ちを聞かせてください'],
  7: ['🔄 事業の方向性を大きく変えた出来事はありましたか？', '🌏 業界全体の変化にどう対応しましたか？', '💡 新しい事業を始めたきっかけは何ですか？'],
  8: ['🌊 経営の危機はありましたか？', '💴 資金繰りが厳しかった時期の話を聞かせてください', '🤝 ピンチの時に助けてくれた人や出来事はありますか？'],
  9: ['🏅 会社として誇れる実績やエピソードを教えてください', '📰 メディアや業界で注目された出来事はありますか？', '😊 お客様から最も感謝された経験は何ですか？'],
  10: ['📖 経営の指針にしてきた言葉や考え方はありますか？', '🙏 尊敬する経営者や師匠はいますか？', '⚖️ 経営判断で迷った時、何を基準にしましたか？'],
  11: ['🌧️ 会社が最も苦しかった時期はいつですか？', '💪 どのようにして乗り越えましたか？', '🌈 その経験から学んだことは何ですか？'],
  12: ['🏘️ 地域や社会への貢献で心がけてきたことはありますか？', '🤝 地域のイベントや団体への関わりはありますか？', '🌱 社会のために何か続けてきたことはありますか？'],
  13: ['🌟 会社の雰囲気・社風はどうやって作られましたか？', '🎉 社員との楽しい思い出やイベントはありますか？', '💬 大切にしてきた社内のルールや文化はありますか？'],
  14: ['👶 後継者への思いを聞かせてください', '📜 次の世代に伝えたい経営の知恵は何ですか？', '🌸 会社の未来への願いを聞かせてください'],
  15: ['🚀 これから会社にどうなってほしいですか？', '💌 社員・お客様・社会へのメッセージを', '🌈 創業者として最後に伝えたいことは？'],
};

// 終活ノート用のヒント
export const SHUKATSU_QUESTION_HINTS: Record<number, string[]> = {
  1: ['🏥 かかりつけのお医者さんはいますか？', '💊 毎日飲んでいるお薬はありますか？', '😊 最近の体の調子はいかがですか？'],
  2: ['🩺 持病がある場合、診断を受けた時のことを教えてください', '💉 アレルギーや注意が必要なことはありますか？', '🏨 入院や手術の経験はありますか？'],
  3: ['📞 緊急時に真っ先に連絡してほしい方は誰ですか？', '🏠 家族以外で頼れる方はいますか？', '📋 連絡先の一覧をまとめておきましょう'],
  4: ['🏡 自宅での介護を希望しますか？', '🏨 介護施設に入る場合の希望はありますか？', '👨‍👩‍👧 家族にどんなサポートをしてほしいですか？'],
  5: ['🏥 延命治療についての考えを教えてください', '📋 エンディングノートや事前指示書はありますか？', '💬 医療について家族と話し合ったことはありますか？'],
  6: ['🏠 不動産（自宅・土地など）について教えてください', '💰 預金や投資の概要を整理しましょう', '📄 重要な書類はどこに保管していますか？'],
  7: ['📋 加入している保険の種類を教えてください', '🏦 年金や退職金の状況はいかがですか？', '💳 クレジットカードやローンの状況は？'],
  8: ['💎 大切にしている思い出の品はありますか？', '📦 処分してほしいものや、渡したい人がいる物はありますか？', '📚 本・コレクションの扱い希望はありますか？'],
  9: ['💻 使っているSNSやメールアカウントはありますか？', '🔑 パスワードの管理方法を教えてください', '📱 スマートフォンのデータについての希望は？'],
  10: ['⛪ 葬儀の形式（仏式・神式・無宗教など）の希望は？', '💐 お花や規模についての希望はありますか？', '👥 葬儀に呼んでほしい方はいますか？'],
  11: ['⛩️ お墓や納骨についての希望を教えてください', '🌸 散骨や樹木葬などを考えていますか？', '🏠 お墓の管理についての希望はありますか？'],
  12: ['📜 遺言書はありますか？', '⚖️ 財産の分け方についての希望はありますか？', '🤝 相続について家族と話し合いましたか？'],
  13: ['💌 家族へ伝えたいメッセージを自由にどうぞ', '🙏 感謝の気持ちを伝えたい方はいますか？', '❤️ 家族への想いを言葉にしてみましょう'],
  14: ['🤝 友人・知人へのメッセージはありますか？', '📮 お世話になった方へ伝えたいことは？', '🌸 懐かしい友人へひとこと伝えるとしたら？'],
  15: ['🌟 最期まで大切にしたい生き方はどんなものですか？', '😊 幸せだと感じる瞬間はどんな時ですか？', '🕊️ あなたにとって良い人生とはどんな人生でしたか？'],
};

export function getQuestionHints(fieldType: string, questionId: number, lang?: string): string[] {
  if (lang === 'en') {
    if (fieldType === 'kaishaishi') return KAISHAISHI_QUESTION_HINTS_EN[questionId] || [];
    return JIBUNSHI_QUESTION_HINTS_EN[questionId] || [];
  }
  if (fieldType === 'kaishaishi') return KAISHAISHI_QUESTION_HINTS[questionId] || [];
  if (fieldType === 'shukatsu') return SHUKATSU_QUESTION_HINTS[questionId] || [];
  return JIBUNSHI_QUESTION_HINTS[questionId] || [];
}

// ============================================================
// English question hints (Life Story)
// ============================================================
export const JIBUNSHI_QUESTION_HINTS_EN: Record<number, string[]> = {
  1: [
    '🌍 When you were born, the world was changing fast. What do you remember about everyday life back then?',
    '📻 Entertainment looked very different — radio, early TV, live music. What did your family enjoy?',
    '🍽️ Food and daily routines were quite different. What meals or family traditions stand out from your early years?',
  ],
  2: [
    '🏠 What was your home like growing up — a house, a farm, an apartment?',
    '👶 What games or activities did children enjoy in your neighborhood?',
    '🌿 Is there a season memory from childhood that stands out — a holiday, a snowstorm, a harvest?',
  ],
  3: [
    '👨‍👩‍👧‍👦 Did you have brothers or sisters? What was family life like at home?',
    '👴 Were grandparents part of your household or nearby? Do you have memories of them?',
    '🏡 What did your parents do for work, and how did that shape your childhood?',
  ],
  4: [
    '🏫 Was there a teacher who left a strong impression on you?',
    '⚾ What activities, sports, or clubs did you pursue after school?',
    '📚 Were there subjects you loved or struggled with? How did school shape you?',
  ],
  5: [
    '🚂 How did you find your first job — through connections, an ad, or luck?',
    '💼 Do you remember your first paycheck? What did you do with it?',
    '🏢 What was your first boss or mentor like?',
  ],
  6: [
    '💍 What led you to make the most important commitment of your life?',
    '🏠 Did you ever move somewhere new, or build or buy a home?',
    '💼 Did you ever change careers or start something completely new?',
  ],
  7: [
    '🏆 Was there a moment at work when you felt truly proud?',
    '👥 Can you recall a time when a customer or colleague expressed real gratitude?',
    '💡 What is one thing you accomplished that you would like people to remember?',
  ],
  8: [
    '👫 Who has had the greatest influence on your life?',
    '🤝 Is there a friend or colleague you stayed close to for many years?',
    '💕 How did you meet that person, and what made the relationship special?',
  ],
  9: [
    '🎣 When did you develop your main hobby or interest? What drew you to it?',
    '📺 What TV shows, films, or books have stayed with you?',
    '✈️ What travel memory stands out most?',
  ],
  10: [
    '😓 What was the hardest period of your life — at work or at home?',
    '🌧️ Was there someone who helped you through that time?',
    '💪 How did you find the strength to get through it?',
  ],
  11: [
    '📖 What is a lesson from a failure that changed how you lived afterward?',
    '🌱 How has your thinking changed from when you were young?',
    '💬 Is there a phrase, a person, or an experience that helped you grow?',
  ],
  12: [
    '🌅 What do you look forward to each day?',
    '👨‍👩‍👧 What do you cherish most about your time with family or friends?',
    '🙏 What habits or practices help you stay well and grounded?',
  ],
  13: [
    '📜 What is the most important lesson you would pass on to younger people?',
    '🌸 What values have guided your life most deeply?',
    '💌 If you could write a letter to the next generation, what would you say?',
  ],
  14: [
    '😊 When did you feel the most joy or contentment in your life?',
    '🎉 What celebrations — a wedding, a graduation, a birth — do you remember most?',
    '🌈 What moment, when you look back, makes you think "that was really good"?',
  ],
  15: [
    '🌟 Is there something you still want to do or try?',
    '💌 Is there something you have been meaning to say to someone you love?',
    '🕊️ What does a life well lived mean to you?',
  ],
};

// ============================================================
// English question hints (Company History)
// ============================================================
export const KAISHAISHI_QUESTION_HINTS_EN: Record<number, string[]> = {
  1: ['💡 When did the idea of starting a business first come to you?', '👥 Who was the first person you talked to about it?', '🌍 What was the economic climate like at the time?'],
  2: ['🏢 What did your first office or workspace look like?', '💼 Is the core business still the same as at the start?', '💰 How did you fund the early days?'],
  3: ['😓 What was the hardest moment in those first years?', '🌙 Do you remember working through the night? What kept you going?', '💪 Why did you keep pushing when things were difficult?'],
  4: ['🤝 Tell me how you found your very first customer.', '📞 How did it feel to get that first order?', '🏆 What did you do to earn trust in the early days?'],
  5: ['📈 When did you first feel the business was really gaining momentum?', '👨‍💼 What was the atmosphere like as the team grew?', '🎉 What was your first big contract or milestone?'],
  6: ['👥 Who was the colleague or team member who made the biggest difference?', '🌱 How did you approach developing people in the business?', '🤝 What would you most like your team to know about your gratitude?'],
  7: ['🔄 Was there a moment when you had to change direction significantly?', '🌏 How did shifts in the market or industry force you to adapt?', '💡 What prompted you to launch a new product or service?'],
  8: ['🌊 Was there a time when the business faced a serious crisis?', '💴 Were there periods when cash flow was truly difficult?', '🤝 Who or what came to the rescue in the tough times?'],
  9: ['🏅 What achievement or story best captures what your company stands for?', '📰 Did you ever receive notable recognition from press or industry?', '😊 What customer thank-you has meant the most to you?'],
  10: ['📖 What guiding principle has shaped how you run the business?', '🙏 Was there a mentor or admired leader who influenced your approach?', '⚖️ When facing a hard decision, what was your compass?'],
  11: ['🌧️ When was the company most at risk?', '💪 How did you manage to survive and recover?', '🌈 What did that experience teach you?'],
  12: ['🏘️ How has your company contributed to the local community?', '🤝 Were there causes or organizations you actively supported?', '🌱 Is there something the company has kept doing to give back?'],
  13: ['🌟 How would you describe the culture of your company?', '🎉 What are some favorite memories of time with the team?', '💬 What unwritten rules or values shaped the way things got done?'],
  14: ['👶 What do you hope the next generation of leadership will carry forward?', '📜 What business wisdom do you most want to pass on?', '🌸 What is your deepest wish for the company\'s future?'],
  15: ['🚀 Where would you like to see the company go from here?', '💌 What message would you leave for your team, customers, and community?', '🌈 What would you like the company\'s legacy to be?'],
};
