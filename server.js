console.log('=== Cobbler Server            ===');
console.log('=== Race to 1,000,000,000,000 ===');

var KEY_COUNT          = 'cobbler:count';
var KEY_SPEED          = 'cobbler:speed';
var CHANNEL_NAME       = 'cobbler';
var UPDATE_INTERVAL    = 30000;

// Data
var count = 0;
var speed = 0;

// Redis
var ioredis = require('ioredis');
var redis   = new ioredis();
var store   = new ioredis();

// Socket
var io;

getData(function(data) {
    console.log(data);
});

// Get started
getData(function(data) {
    count = data.count;
    speed = data.speed;
    
    last = timestamp();
    
    // Start sockets
    io = require('socket.io')(9090, {
        // origins: 'episode17.com:*'
    });
    
    console.log(io.origins());
    
    io.on('connection', function (socket) {
        socket.emit('start', {
            count: count,
            speed: speed,
        });
    });
    
    // Start pub/sub
    redis.subscribe(CHANNEL_NAME);
    
    // Start client updates
    setInterval(function() {        
        io.emit('update', {
            count: count,
            speed: speed,
        });
    }, UPDATE_INTERVAL);
});

redis.on('message', function (channel, message) {    
    if (channel == CHANNEL_NAME && message == 'update') {
        getData(function(data) {
            count = data.count;
            speed = data.speed;
            
            console.log('[redis]', KEY_COUNT, count);
            console.log('[redis]', KEY_SPEED, speed);
        });  
    }
});

function getData(cb) {
    store
        .pipeline()
        .get(KEY_COUNT)
        .get(KEY_SPEED)
        .exec(function(err, result) {
            cb({
                count: parseInt(result[0][1]),
                speed: parseFloat(result[1][1])
            });
        });
}

function timestamp() {
    var time = process.hrtime();
    return time[0] + (time[1] / 1e9);
    
}