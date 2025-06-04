// app/moments.ts

export let moments: string[] = [];

export function addMoment(story: string) {
  moments.unshift(story); // adds to the top
}

export function getMoments() {
  return moments;
}
