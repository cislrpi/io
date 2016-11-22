module.exports = class RabbitManager {
    constructor(mq) {
        this.mgmturl = `http://${mq.hostname}:15672/api`
        this.config = mq
        this.config.vhost = mq.vhost === '/' ? '%2f' : mq.vhost
    }

    getQueues() {
        return fetch(`${this.mgmturl}/queues/${this.config.vhost}`, {
            cache: 'no-cache',
            mode: 'cors',
            headers: {
                'Authorization': 'Basic ' + btoa(`${this.config.username}:${this.config.password}`)
            }
        })
    }
}
