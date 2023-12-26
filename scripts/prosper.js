function addMonth(yearMonth){
    let year = parseInt(yearMonth.slice(0,4))
    let month = parseInt(yearMonth.slice(4))
    if(month==12){
        year++
        month=1
    } else {
        month++
    }
    let m = `${month}`
    return [`${year}${m.padStart(2,'0')}`,new Date(year,month,0).getDate()]
}

function subtractMonth(yearMonth){
    let year = parseInt(yearMonth.slice(0,4))
    let month = parseInt(yearMonth.slice(4))
    if(month==1){
        year--
        month=12
    } else {
        month--
    }
    let m = `${month}`
    return `${year}${m.padStart(2,'0')}`
}

// class Deposit {
//     constructor(data = {}){
//         console.log('Deposit.constructor')
//         this.yearMonth = data.yearMonth || null
//         this.amount = data.amount || 0
//     }
// }

class Note {
    constructor(data = {}){
        // console.log('Note.constructor')
        this.id = Date.now()
        this.originazation = data.originazation || null
        this.amount = data.amount || 0
        this.rate = data.rate || .10
        this.term = data.term || 36
        this.payments = []
        this.processAmortization()
    }
    processAmortization(){
        // console.log('processAmortization')
        let ym = null
        let yearMonth = this.originazation
        let R = this.rate/12
        let pmt = (this.amount*R)/(1-((1+R)**(-1*this.term))) //https://superuser.com/questions/871404/what-would-be-the-the-mathematical-equivalent-of-this-excel-formula-pmt
        let int = 0
        let pri = 0
        let bal = this.amount
        for(let i = 1; i <= this.term; i++){
            ym = addMonth(yearMonth)
            yearMonth = ym[0]
            int = (bal*this.rate)/365*(ym[1])
            if (i === this.term){
                pmt = int + bal
            }
            pri = pmt - int
            bal -= pri
            this.payments.push(new Payment(
                {
                    'yearMonth': ym[0],
                    'interest': int,
                    'principal': pri,
                    'balance': bal
                }
            ))
        }
    }
}

class Payment {
    constructor(data = {}){
        // console.log('Payment.constructor')
        this.yearMonth = data.yearMonth || null
        this.interest = data.interest || 0
        this.principal = data.principal || 0
        this.balance = data.balance || 0
    }
}

class Statement {
    constructor(data = {}){
        // console.log('Statement.constructor')
        this.yearMonth = data.yearMonth || null
        this.deposits = data.deposits || 0
        this.interest = data.interest || 0
        this.principal = data.principal || 0
        this.balance = data.balance || 0
        this.remainder = data.remainder || 0
    }
    get dateString(){
        let year = parseInt(this.yearMonth.slice(0,4))
        let month = parseInt(this.yearMonth.slice(4))
        let m = `${month}`
        return `${year} - ${m.padStart(2,'0')}`
    }
}

class Account {
    constructor(data = {}){
        // console.log('Account.constructor')
        this.deposits = data.deposits || []
        this.autoInvestAmount = data.autoInvestAmount || 100
        this.endOfForecast = data.endOfForecast || '203905'
        this.statements = []
        this.processDeposits()
        this.processStatements()
    }
    processDeposits(){
        // console.log('processDeposits')
        this.deposits = this.deposits.sort(this.compare) // This sort isn't really needed
        this.deposits.forEach((deposit) => {
            let s = this.getCurrentStatement(deposit.yearMonth)
            s.deposits += deposit.amount
        })
    }
    processStatements(){
        // console.log('processStatements')
        this.statements = this.statements.sort(this.compare)
        let s = this.statements[0]
        let ym = s.yearMonth
        while (this.endOfForecast >= s.yearMonth){
            this.processStatement(s)
            ym = addMonth(ym)[0]
            s = this.getCurrentStatement(ym)
        }
    }
    processStatement(s){
        console.log(`processStatement ${s.dateString}`)
        let ps = this.getPreviousStatement(s.yearMonth)
        console.log(ps)
        let availableFunds = s.deposits + s.interest + s.principal + ps.remainder
        let investmentAmount = 0
        let numberOfNotesToBuy = 0
        if (availableFunds >= this.autoInvestAmount) {
            numberOfNotesToBuy = parseInt(availableFunds/this.autoInvestAmount)
            investmentAmount = numberOfNotesToBuy * this.autoInvestAmount
            s.remainder = availableFunds - investmentAmount
        } else {
            s.remainder = availableFunds
        }
        
        if (investmentAmount > 0){
            console.log(s.yearMonth)
            this.processNote(new Note({
                "originazation": s.yearMonth,
                "amount": investmentAmount
            }))
        }
    }
    processNote(n){
        // console.log('processNote')
        n.payments.forEach((p) => {
            if (p.yearMonth <= this.endOfForecast) {
                let s = this.getCurrentStatement(p.yearMonth)
                // console.log(p)
                // console.log(s.yearMonth)
                s.interest += p.interest
                s.principal += p.principal
                s.balance += p.balance
                // console.log(s.remainder)
                s.remainder += (p.interest+p.principal)
                // console.log(s.remainder)
            }
        })
    }
    compare(a,b){
        return a.yearMonth > b.yearMonth ? 1 : -1
    }
    getPreviousStatement(yearMonth){
        // console.log('getPreviousStatement')
        let ym = subtractMonth(yearMonth)
        let result = null
        this.statements.forEach((s) => {
            if (s.yearMonth === ym) result = s
        })
        if (result === null) {
            result = new Statement({'yearMonth':ym})
        }
        return result
    }
    getCurrentStatement(yearMonth){
        // console.log('getCurrentStatement')
        let result = null
        this.statements.forEach((s) => {
            if (s.yearMonth === yearMonth) result = s
        })
        if (result === null) {
            result = new Statement({'yearMonth':yearMonth})
            this.statements.push(result)
        }
        return result
    }
}

let formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
})

function stmtEle(s){
    // console.log('stmtEle')
    let stmt = document.createElement('fieldset')
    let ym = document.createElement('legend')
    ym.innerText = s.dateString
    stmt.appendChild(ym)
    let bal = document.createElement('div')
    bal.innerText = `BAL: ${formatter.format(s.balance)}`
    stmt.appendChild(bal)
    let dep = document.createElement('div')
    dep.innerText = `DEP: ${formatter.format(s.deposits)}`
    stmt.appendChild(dep)
    let int = document.createElement('div')
    int.innerText = `INT: ${formatter.format(s.interest)}`
    stmt.appendChild(int)
    let pri = document.createElement('div')
    pri.innerText = `PRI: ${formatter.format(s.principal)}`
    stmt.appendChild(pri)
    let res = document.createElement('div')
    res.innerText = `REM: ${formatter.format(s.remainder)}`
    stmt.appendChild(res)
    return stmt
}

function money(val){
    return formatter.format(val)
}

function init(){
    let deposits = [{
        'yearMonth': '201805',
        'amount': 100
    },{
        'yearMonth': '201806',
        'amount': 100
    },{
        'yearMonth': '201807',
        'amount': 100
    },{
        'yearMonth': '201808',
        'amount': 100
    },{
        'yearMonth': '201809',
        'amount': 100
    },{
        'yearMonth': '201810',
        'amount': 100
    },{
        'yearMonth': '201811',
        'amount': 100
    },{
        'yearMonth': '201812',
        'amount': 100
    },{
        'yearMonth': '202001',
        'amount': 350
    }]
    let years = [
        {'year':'201901','recurringAmount':100},
        {'year':'202001','recurringAmount':200},
        {'year':'202101','recurringAmount':400},
        {'year':'202201','recurringAmount':600},
        {'year':'202301','recurringAmount':800},
        {'year':'202401','recurringAmount':1000},
        {'year':'202501','recurringAmount':1200},
        {'year':'202601','recurringAmount':1400},
        {'year':'202701','recurringAmount':1600},
        {'year':'202801','recurringAmount':1800},
        {'year':'202901','recurringAmount':2000},
        {'year':'203001','recurringAmount':2000},
        {'year':'203101','recurringAmount':2000},
        {'year':'203201','recurringAmount':2000},
        {'year':'203301','recurringAmount':2000},
        {'year':'203401','recurringAmount':2000},
        {'year':'203501','recurringAmount':2000},
        {'year':'203601','recurringAmount':2000},
        {'year':'203701','recurringAmount':2000},
        {'year':'203801','recurringAmount':2000},
        {'year':'203901','recurringAmount':2000}
    ]
    function compare(a,b){
        return a.yearMonth > b.yearMonth ? 1 : -1
    }
    years.forEach((year) => {
        let ym = year.year
        for(i=0;i<12;i++){
            deposits.push({
                'yearMonth': ym,
                'amount': year.recurringAmount
            })
            ym = addMonth(ym)[0]
        }
    })
    console.log(deposits.sort(compare))
    let acct = new Account({
        'deposits': deposits
    })    
    acct.statements.forEach((s) => {
        body.appendChild(stmtEle(s))
    })
}