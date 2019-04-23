const codeforces = require("cf-api-wrapper")

codeforces.contest.list().then((data) => data.result.reduce((contest_ids, contest) => {
    if (contest.relativeTimeSeconds > 0)
        return [...contest_ids, contest.id]
    return contest_ids
}, [])).then(ids => {
    const num_handles = process.argv.length
    const promises = []
    for (var i = 2; i < num_handles; i++) {
        promises.push(codeforces.user.status({handle: process.argv[i]})
            .then(data => data.result.reduce((contest_ids, submission) => [...contest_ids, submission.contestId], [])))
    }
    Promise.all(promises).then(users_bad_contests => {
        var bad_contests = []
        users_bad_contests.forEach(ids => {
            bad_contests = bad_contests.concat(ids)
        })
        bad_contests = [...new Set(bad_contests)]
        const good_contests = ids.filter(id => bad_contests.indexOf(id) === -1)
        //
    })
})

