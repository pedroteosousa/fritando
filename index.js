#!/usr/bin/env node

const _cliProgress = require('cli-progress')
const codeforces = require("cf-api-wrapper")
const program = require("commander")
const chalk = require('chalk')
const promiseRetry = require('promise-retry')

program
    .version('0.1.0')
    .usage('[options] <file ...>')
    .option('-s, --size <n>', 'amount of contests to consider', parseInt)
    .option('-h, --handles <items>', 'list of user handles', (list) => list.split(','))
    .option('-g, --gym', 'consider only gym contests')
    .parse(process.argv)

const getURL = id => {
    var baseURL = 'https://codeforces.com/';
    if(program.gym)
        baseURL += "gym/";
    else
        baseURL += "contest/";
    return baseURL + id;
}

const retryCall = (call, params) => {
    return promiseRetry((retry, number) => {
        return new Promise((resolve, reject) => {
            call(params).then(data => {
                if (data.status === undefined) {
                    reject()
                } else {
                    resolve(data)
                }
            })
        }).catch(retry)
    })
}

const getGoodContests = (size, handles) => {
    const bar = new _cliProgress.Bar({
        stopOnComplete: true,
        format: '[{bar}] {percentage}% | {value}/{total}',
    })
    bar.start(handles.length + 1, 0)
    return retryCall(codeforces.contest.list, {gym: program.gym}).then(data => data.result.reduce((contest_ids, contest) => {
        if (contest.relativeTimeSeconds > 0)
            return [...contest_ids, {
                name: contest.name,
                id: contest.id,
                url: getURL(contest.id),
            }]
        return contest_ids
    }, [])).then(ids => {
        bar.increment()
        const promises = []
        handles.forEach(handle => {
            promises.push(retryCall(() => codeforces.user.status({handle})).then(data => {
                bar.increment()
                return data.result.reduce((contest_ids, submission) => [...contest_ids, submission.contestId], [])
            }))
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

