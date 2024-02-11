const queue: any[] = [];
let isFlushPending = false;
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}

export function nextTick(fn) {
  return fn ? Promise.resolve().then(fn) : Promise.resolve();
}

function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(() => {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
      job && job();
    }
  });
}
