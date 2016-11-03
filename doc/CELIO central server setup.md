# CELIO central server setup

## Install rabbitmq
```
echo 'deb http://www.rabbitmq.com/debian/ testing main' |
        sudo tee /etc/apt/sources.list.d/rabbitmq.list
wget -O- https://www.rabbitmq.com/rabbitmq-release-signing-key.asc |
        sudo apt-key add -
sudo apt-get update

sudo apt-get install rabbitmq-server

sudo rabbitmq-plugins enable rabbitmq_management rabbitmq_web_stomp

sudo rabbitmqctl add_user <username> <password>
sudo rabbitmqctl set_user_tags <username> administrator
sudo rabbitmqctl set_permissions -p </vhost> <username> ".*" ".*" ".*"
```

Optional: To enable TLS, edit `/etc/rabbitmq/rabbitmq.config`
```
[
  {rabbit, [
     {ssl_listeners, [5671]},
     {ssl_options, [{cacertfile,"/path/to/ca.pem"},
                    {certfile,"/path/to/cert.pem"},
                    {keyfile,"/path/to/key.pem"},
                    {password,"password to key.pem"},
                    {verify,verify_none}]}
   ]},
  {rabbitmq_web_stomp,
      [{ssl_config, [{port,       15671},
                     {backlog,    1024},
                     {certfile,   "/path/to/cert.pem"},
                     {keyfile,    "/path/to/key.pem"},
                     {cacertfile, "/path/to/ca.pem"},
                     {password,   "password to key.pem"}]}]}
].
```

## Install Redis
`sudo apt install redis-server redis-tools`

Edit /etc/redis/redis.conf:
1. Find `requirepass`, uncomment the line, and change the password.
2. Find `notify-keyspace-events` replace "" with KA
3. Find `rename-command` section, and add
```
rename-command CONFIG ""
rename-command DEBUG ""
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command PEXPIRE ""
rename-command SHUTDOWN ""
rename-command BGREWRITEAOF ""
rename-command BGSAVE ""
rename-command SAVE ""
rename-command SPOP ""
rename-command RENAME ""
```
4. Restart redis:
`sudo systemctl restart redis`

## Install Webdis
Version 0.1.2 and above is required to do authentication over CORS.
For now, we have to compile it from source.
1. First, we need the systemd init script from the deb package, so install the deb package first:
`sudo apt install webdis`
2. Compile new webdis:
```
sudo apt-get install libevent-dev
git clone https://github.com/nicolasff/webdis.git
cd webdis
make clean all
sudo mv webdis /usr/bin
```
3. Edit `/etc/webdis/webdis.json` to something like below, note to change username and passwords.
```
{
    "redis_host": "127.0.0.1",

    "redis_port": 6379,
    "redis_auth": "<redis_password>",

    "http_host": "0.0.0.0",
    "http_port": 7379,
    "threads": 2,

    "daemonize": true,
    "pidfile": "/var/run/webdis/webdis.pid",

    "database": 0,

    "acl": [
      {
        "disabled": ["*"]
      },
      {
        "http_basic_auth": "<username>:<password>",
        "enabled": ["*"],
        "disabled": ["DEBUG", "FLUSHDB", "FLUSHALL", "PEXPIRE", "CONFIG", "SHUTDOWN", "BGREWRITEAOF", "BGSAVE", "SAVE", "SPOP", "RENAME"]
      }
    ],
    "verbosity": 3,
    "logfile": "/var/log/webdis/webdis.log"
}
```
4. Restart webdis:
`sudo systemctl restart webdis`
