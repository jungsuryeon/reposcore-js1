const { Octokit } = require('@octokit/rest');
const Table = require('cli-table3');

class RepoAnalyzer {
    constructor(repoPath, token) {
        this.repoPath = repoPath;
        this.token = token; // 자신의 github token
        this.participants = new Map();
        this.octokit = token ? new Octokit({auth: token}) : new Octokit(); // 토큰이 등록되었을 경우 인증, 안되었을 경우는 비인증 상태로 진행
    }

    async validateToken(){ // API 토큰 인증
        if(!this.token){
            console.log('등록된 토큰이 없어 비인증 상태로 진행합니다.');
            return;
        }
        console.log('토큰 인증을 진행합니다...')
        try{
            await this.octokit.rest.users.getAuthenticated();
            console.log('토큰이 정상적으로 등록되었습니다.');
        }catch(error){
            if(error.status == 401){
                throw new Error('Github 토큰 인증에 실패하여 프로그램을 종료합니다, 유효한 토큰인지 확인해주세요.');
            }else{
                throw new Error(`Github 토큰 인증 중 오류가 발생했습니다. ${error.message}`);

            }
        }
    }
        

    async collectPRsAndIssues() {
        console.log('Collecting PRs and issues...');

        const [owner, repo] = this.repoPath.split('/') // 사용자, 저장소 이름 추출
        let page = 1

        // 확인용 카운터, 추후 제거.
        let bugFeatPRcnt = 0, docPRcnt = 0;
        let bugFeatissueCnt = 0, docissueCnt = 0;

        while(true){
            const {data : response} = await this.octokit.rest.issues.listForRepo({ // 이슈(일반 이슈 + PR) 데이터를 요청.
                owner, 
                repo, 
                state: 'all',
                per_page: 100,
                page
            });

            response.forEach(issue => {
                if (!this.participants.has(issue.user.login)){ // 존재하지 않는 사용자라면 초기화.
                    this.participants.set(issue.user.login, {
                        pullRequests : {bugAndFeat : 0, doc : 0}, 
                        issues : {bugAndFeat : 0, doc : 0}, 
                        comments : 0
                    });
                }

                if (issue.pull_request !== undefined){  // PR인 경우.
                    if (issue.pull_request.merged_at !== null) {  // PR이 병합되었는지 확인.
                        // 라벨에 따른 분류, 라벨은 문서, 기능, 버그 세 종류만 존재하며 한 이슈/PR에 하나의 라벨만 붙는다고 가정. 라벨이 없다면 개수를 추가하지 않음.
                        if (issue.labels.length != 0 && issue.labels[0].name == 'documentation'){  
                            this.participants.get(issue.user.login).pullRequests.doc += 1
                            docPRcnt++;
                        }
                        else if (issue.labels.length != 0){
                            this.participants.get(issue.user.login).pullRequests.bugAndFeat += 1
                            bugFeatPRcnt++;
                        }
                    }
                }
                else { // 이슈인 경우.
                    if ( // 반려된 이슈들을 제외시킴.
                        issue.state_reason == 'completed' ||  // 정상적으로 닫힌 이슈.
                        issue.state_reason == null ||         // 아직 열려있는 이슈는 null로 표시됨.
                        issue.state_reason == 'reopened'      // 닫혔던 이슈가 다시 열린 경우.
                    ){
                        if (issue.labels.length != 0 && issue.labels[0].name == 'documentation'){
                            this.participants.get(issue.user.login).issues.doc += 1
                            docissueCnt++;
                        }
                        else if (issue.labels.length != 0){
                            this.participants.get(issue.user.login).issues.bugAndFeat += 1
                            bugFeatissueCnt++;
                        }
                    } 
                }
            });

            if (response.length < 100){ // 마지막 페이지라면 루프를 탈출.
                break;
            }
            page++; // 다음 페이지로 넘어감.
        }

        // 확인용 console.log, 추후 제거.
        
        console.log('\n***수집한 정보를 출력합니다.***\n')
        this.participants.forEach((value, key) => {
            console.log(
                `${key}\n`+ 
                `bug and faeture PR : ${value.pullRequests.bugAndFeat}\n`+
                `documents PR : ${value.pullRequests.doc}\n`+
                `bug and faeture issues : ${value.issues.bugAndFeat}\n`+ 
                `documents issues : ${value.issues.doc}\n`)
        })
        
        console.log('\n***total***\n')
        console.log(`bug and Feat PRs : ${bugFeatPRcnt}`)
        console.log(`doc PRs : ${docPRcnt}`)
        console.log(`bug and Feat issues : ${bugFeatissueCnt}`)
        console.log(`doc issues : ${docissueCnt}\n`)
    }

    calculateScores() {
        console.log('"calculateScores"함수가 아직 구현되지 않았습니다.')
        /*
        const scores = {};
        for (const [participant, data] of this.participants) {
            scores[participant] = (data.pullRequests || 0) * 0.4 +
                                 (data.issues || 0) * 0.3 +
                                 (data.comments || 0) * 0.3;
        }
        return scores;
        */
    }

    generateTable(scores) {
        console.log('"generateTable"함수가 아직 구현되지 않았습니다.')
        /*
        const table = new Table({ head: ['Participant', 'Score'] });
        Object.entries(scores).forEach(([name, score]) => table.push([name, score.toFixed(2)]));
        console.log(table.toString());
        */
    }

    async generateChart(scores) {
        console.log('"generateChart"함수가 아직 구현되지 않았습니다.')
        /*
        // Placeholder: Requires a charting library and canvas setup for CLI
        console.log('Chart generation placeholder');
        */
    }
}

module.exports = RepoAnalyzer;
