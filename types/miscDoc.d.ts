interface DistDoc {
  when: Date
  distance: number
}
type PowerDoc = {
  when: Date
  state: string
  runTime?: number
  pump: string
}
type PowerData = {
  what: string
  when: Date
  runTime: string
}
type PowerGroup = {
  time: number
  frags: string
  sinceLastPump: number
  when: Date
  dists: string
}
