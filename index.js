#!/usr/bin/env node

const codeforces = require("cf-api-wrapper")
const program = require("commander")
const chalk = require('chalk')

program
    .version('0.1.0')
    .usage('[options] <file ...>')
    .option('-s, --size <n>', 'amount of contests to consider', parseInt)
    .option('-h, --handles <items>', 'list of user handles', (list) => list.split(','))
    .parse(process.argv)

const getURL = id => {
    return 'https://codeforces.com/contest/' + id
}

const getGoodContests = (size, handles) => {
    return codeforces.contest.list().then((data) => data.result.reduce((contest_ids, contest) => {
        if (contest.relativeTimeSeconds > 0)
            return [...contest_ids, {
                name: contest.name,
                id: contest.id,
                url: getURL(contest.id),
            }]
        return contest_ids
    }, [])).then(ids => {
        const promises = []
        handles.forEach(handle => {
            promises.push(codeforces.user.status({handle})
                .then(data => data.result.reduce((contest_ids, submission) => [...contest_ids, submission.contestId], [])))
        })
        return Promise.all(promises).then(users_bad_contests => {
            var bad_contests = []
            users_bad_contests.forEach(ids => {
                bad_contests = bad_contests.concat(ids)
            })
            bad_contests = [...new Set(bad_contests)]
            return ids.filter(contest => bad_contests.indexOf(contest.id) === -1).slice(0, size)
        })
    })
}

getGoodContests(program.size, program.handles).then(contests => contests.forEach(({name, url}) => {
    console.log(chalk.blue(name) + ": " + url)
}))
