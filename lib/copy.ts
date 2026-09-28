const reminderBodies = [
  '这件事还在，我替你记着呢。',
  '不用着急，想起来的时候看一眼就好。',
  '你慢慢来，我记着呢。',
  '轻轻提醒一下：它还在这儿。',
  '准备好了再动也没关系，我替你守着。',
];

const motivationLines = [
  '迈一小步就够了，不必一次做完。',
  '先做眼前能碰得到的那一点。',
  '你不是懒，只是还没找到入口。',
  '开始的感觉往往比想的轻一点。',
  '把目光放在第一步，后面的稍后再说。',
  '我记着呢，你只负责轻轻动一下。',
  '完成一点点，也算今天有收获。',
  '不催你，只是陪你重新看见这件事。',
  '可以很小、很慢，仍然算在做。',
  '先呼吸一下，再选一个最小动作。',
  '卡住没关系，换个更小的切口试试。',
  '你已经打开它了，这本身就是一步。',
  '不用完美，做到“开始”就很好。',
  '我替你记着全貌，你只管眼前这一寸。',
  '拖延来了也不丢人，我们一起绕过去。',
  '如果太大，就只做第一步的一半。',
  '温柔一点对自己，事情还在，不急着消失。',
  '今天只需要比昨天多碰一下。',
  '把难度调低，把勇气留给开始。',
  '做完再说评价；现在先动手。',
  '你值得被提醒，而不是被责备。',
  '我在这儿，不催骂，只轻轻唤你一声。',
  '一步落地，后面会容易一点。',
  '允许自己慢，也允许自己继续。',
  '先把手机放到一边，只给它五分钟。',
  '小成就也算成就，我替你记着。',
  '不必跟别人比速度，跟自己的节奏走。',
  '想逃开时，就只做三十秒也行。',
  '这件事还在等你，但以温柔的方式。',
  '你来了就好，其余的我们一点点来。',
];

const stepDoneLines = [
  '这一小步，算数。',
  '很好，已经比刚才近一点了。',
  '记下了：你刚完成一步。',
];

const memoDoneLines = [
  '我记着呢，你做到了。',
  '这件事收好了，轻轻为你鼓掌。',
  '完成了。你慢慢来，也终于走到这里。',
];

function pick<T>(list: T[], seed?: number): T {
  if (typeof seed === 'number') {
    return list[Math.abs(seed) % list.length];
  }
  return list[Math.floor(Math.random() * list.length)];
}

export function reminderCopy(title: string) {
  return {
    title: '我记着呢',
    body: `${pick(reminderBodies)}「${title}」`,
  };
}

export function motivationCopy(seed?: number) {
  return pick(motivationLines, seed);
}

export function stepDoneCopy() {
  return pick(stepDoneLines);
}

export function memoDoneCopy() {
  return pick(memoDoneLines);
}
