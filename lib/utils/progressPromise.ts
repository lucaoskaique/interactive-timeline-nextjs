function progressPromise(
  promises: Promise<any>[],
  tickCallback: (progress: number, total: number) => void
): Promise<any[]> {
  const len = promises.length
  let progress = 0

  function tick(promise: Promise<any>) {
    promise
      .then(() => {
        progress++
        tickCallback(progress, len)
      })
      .catch((reason) => {
        console.log(reason)
      })
    return promise
  }

  return Promise.all(promises.map(tick))
}

export default progressPromise
