var test = require("test");
test.setup();

var test_util = require('./test_util');

var net = require('net');
var fs = require('fs');
var path = require('path');
var os = require('os');
var coroutine = require('coroutine');

var base_port = coroutine.vmid * 10000;

var net_config = {
    family: net.AF_INET6,
    address: '::1',
    host: '[::1]'
};

var has_ipv6 = false;

var ni = os.networkInterfaces();

for (var n in ni) {
    ni[n].forEach((c) => {
        if (c.family == 'IPv6')
            has_ipv6 = true;
    });
}

if (!has_ipv6)
    net_config = {
        family: net.AF_INET,
        address: '127.0.0.1',
        host: '127.0.0.1'
    };

var backend = {
    "Windows": "IOCP",
    "Darwin": "KQueue",
    "FreeBSD": "KQueue",
    "Linux": "EPoll"
}[os.type()];


function del(f) {
    try {
        fs.unlink(f);
    } catch (e) {}
}

describe("net", () => {
    it("backend", () => {
        assert.equal(net.backend(), backend);
    });

    var ss = [];

    after(() => {
        ss.forEach((s) => {
            s.close();
        });
    });

    it("echo", () => {
        function connect(c) {
            console.log(c.remoteAddress, c.remotePort, "->",
                c.localAddress, c.localPort);
            try {
                var b;

                while (b = c.recv())
                    c.send(b);
            } finally {
                c.close();
            }
        }

        function accept(s) {
            while (1)
                coroutine.start(connect, s.accept());
        }

        var s = new net.Socket(net_config.family,
            net.SOCK_STREAM);
        ss.push(s);

        s.bind(8080 + base_port);
        s.listen();
        assert.equal(s.localPort, 8080 + base_port);
        coroutine.start(accept, s);

        function conn_socket() {
            var s1 = new net.Socket(net_config.family, net.SOCK_STREAM);
            s1.connect(net_config.address, 8080 + base_port);
            console.log(s1.remoteAddress, s1.remotePort, "<-",
                s1.localAddress, s1.localPort);
            s1.send(new Buffer("GET / HTTP/1.0"));
            assert.equal("GET / HTTP/1.0", s1.recv());
            s1.close();
        }

        function conn() {
            var s1 = net.connect('tcp://' + net_config.host + ':' + (8080 + base_port));
            console.log(s1.remoteAddress, s1.remotePort, "<-",
                s1.localAddress, s1.localPort);
            assert.equal(s1.remotePort, 8080 + base_port);
            s1.send(new Buffer("GET / HTTP/1.0"));
            assert.equal("GET / HTTP/1.0", s1.recv());
            s1.close();
        }

        conn_socket();
        conn();
    });

    it("copyTo", () => {
        var str = "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789";

        for (var i = 0; i < 8; i++)
            str = str + str;

        function accept1(s) {
            while (true) {
                var c = s.accept();

                // c.write(str);

                fs.writeFile(path.join(__dirname, 'net_temp_000001' + base_port), str);
                var f = fs.openFile(path.join(__dirname, 'net_temp_000001' + base_port));
                assert.equal(f.copyTo(c), str.length);
                f.close();
                c.close();
            }
        }

        var s1 = new net.Socket(net_config.family, net.SOCK_STREAM);
        ss.push(s1);

        s1.bind(8081 + base_port);
        s1.listen();
        coroutine.start(accept1, s1);

        function t_conn() {
            var c1 = new net.Socket();
            c1.connect('127.0.0.1', 8081 + base_port);

            var f1 = fs.openFile(path.join(__dirname, 'net_temp_000002' + base_port), 'w');
            assert.equal(c1.copyTo(f1), str.length);
            c1.close();
            f1.close();

            assert.equal(str, fs.readTextFile(path.join(__dirname, 'net_temp_000002' + base_port)));
        }

        for (var i = 0; i < 100; i++)
            t_conn();

        for (var i = 0; i < 10; i++)
            str = str + str;

        t_conn();

        del(path.join(__dirname, 'net_temp_000001' + base_port));
        del(path.join(__dirname, 'net_temp_000002' + base_port));
    });

    it("read & recv", () => {
        function accept2(s) {
            while (true) {
                var c = s.accept();

                c.write('a');
                coroutine.sleep(100);
                c.write('a');
                coroutine.sleep(100);
                c.write('b');
                coroutine.sleep(100);
                c.write('c');
                coroutine.sleep(100);
                c.write('d');
                coroutine.sleep(100);

                c.close();
            }
        }

        var s2 = new net.Socket(net_config.family, net.SOCK_STREAM);
        ss.push(s2);

        s2.bind(8082 + base_port);
        s2.listen();
        coroutine.start(accept2, s2);

        var c1 = new net.Socket();
        c1.connect('127.0.0.1', 8082 + base_port);
        assert.equal('a', c1.recv(100));
        assert.equal('ab', c1.read(2));
        assert.equal('c', c1.read(1));
        assert.equal('d', c1.read(3));
    });

    describe("udp", () => {
        it("sendto/recvfrom", () => {
            setTimeout(() => {
                var c = new net.Socket(net.AF_INET, net.SOCK_DGRAM);
                c.sendto("aaa", "127.0.0.1", 8888);
            }, 100);

            var s = new net.Socket(net.AF_INET, net.SOCK_DGRAM);
            s.bind(8888);

            assert.equal(s.recvfrom().data.toString(), "aaa");
            s.close();
        });

        it("recvfrom address", () => {
            var data;
            setTimeout(() => {
                var c = new net.Socket(net.AF_INET, net.SOCK_DGRAM);
                c.sendto("aaa", "127.0.0.1", 8890);
                data = c.recvfrom();
                console.log(data);
            }, 100);

            var s = new net.Socket(net.AF_INET, net.SOCK_DGRAM);
            s.bind(8890);

            var d = s.recvfrom();
            console.log(d);
            s.sendto("bbb", d.address, d.port);

            coroutine.sleep(100);
            assert.equal(data.data.toString(), "bbb");
            s.close();
        });

        it("broadcast", () => {
            var s = new net.Socket(net.AF_INET, net.SOCK_DGRAM);
            s.bind(8889);

            setTimeout(() => {
                var c = new net.Socket(net.AF_INET, net.SOCK_DGRAM);

                try {
                    c.sendto("bbb", "255.255.255.255", 8889);
                } catch (e) {
                    s.close();
                    throw e;
                }
            }, 100);

            assert.equal(s.recvfrom().data.toString(), "bbb");
            s.close();
        });
    });

    describe("re-entrant", () => {

        it("accept", () => {
            var t = 0;

            function accept2(s, n) {
                ss.push(s.accept());
                t = n;
            }

            var s2 = new net.Socket(net_config.family, net.SOCK_STREAM);
            ss.push(s2);

            s2.bind(8083 + base_port);
            s2.listen();

            coroutine.start(accept2, s2, 1);
            coroutine.sleep(10);
            coroutine.start(accept2, s2, 2);
            coroutine.sleep(10);

            assert.equal(t, 0);

            var c1 = new net.Socket();
            c1.connect('127.0.0.1', 8083 + base_port);
            c1.close();
            coroutine.sleep(10);
            assert.equal(t, 1);

            var c1 = new net.Socket();
            c1.connect('127.0.0.1', 8083 + base_port);
            c1.close();
            coroutine.sleep(10);
            assert.equal(t, 2);

        });

        it("recv", () => {
            var t = 0;

            function recv2(s, d, n) {
                var d = s.recv();
                if (d.toString() == d)
                    t = n;
            }

            function accept2(s) {
                var c = s.accept();
                coroutine.start(recv2, c, "1234", 1);
                coroutine.sleep(10);
                coroutine.start(recv2, c, "4567", 2);
            }

            var s2 = new net.Socket(net_config.family, net.SOCK_STREAM);
            ss.push(s2);

            s2.bind(8084 + base_port);
            s2.listen();

            coroutine.start(accept2, s2);

            var c1 = new net.Socket();
            c1.connect('127.0.0.1', 8084 + base_port);
            coroutine.sleep(100);

            c1.send('1234');
            coroutine.sleep(10);
            assert.equal(t, 1);

            c1.send('4567');
            coroutine.sleep(10);
            assert.equal(t, 2);
        });

        it("send", () => {

        });
    });

    it("timeout", () => {
        function accept4(s) {
            while (true) {
                ss.push(s.accept());
            }
        }

        var s2 = new net.Socket(net_config.family, net.SOCK_STREAM);
        ss.push(s2);

        s2.bind(8085 + base_port);
        s2.listen();
        coroutine.start(accept4, s2);

        var c1 = new net.Socket();

        c1.timeout = 50;

        var no = test_util.countObject('Timer');
        c1.connect('127.0.0.1', 8085 + base_port);
        for (var i = 0; i < 1000 && no !== test_util.countObject('Timer'); i++)
            coroutine.sleep(50);
        assert.equal(no, test_util.countObject('Timer'));

        var t1 = new Date();
        assert.throws(() => {
            c1.recv();
        });
        for (var i = 0; i < 1000 && no !== test_util.countObject('Timer'); i++)
            coroutine.sleep(1);
        assert.equal(no, test_util.countObject('Timer'));
        var t2 = new Date();

        assert.greaterThan(t2 - t1, 49);
        assert.lessThan(t2 - t1, 500);

        var c2 = new net.Socket();
        c2.timeout = 50;
        var t1 = new Date();
        assert.throws(() => {
            c2.connect('192.166.166.166', 8086 + base_port);
        });
        for (var i = 0; i < 1000 && no !== test_util.countObject('Timer'); i++)
            coroutine.sleep(1);
        assert.equal(no, test_util.countObject('Timer'));
        var t2 = new Date();

        assert.greaterThan(t2 - t1, 40);
        assert.lessThan(t2 - t1, 500);
    });

    it("bind same port", () => {
        var svr = new net.TcpServer(8811 + base_port, (c) => {});
        assert.throws(() => {
            new net.TcpServer(8811 + base_port, (c) => {});
        });
        ss.push(svr.socket);
    });

    it("stats", () => {
        var svr = new net.TcpServer(8812 + base_port, (c) => {
            var d;
            while (d = c.read(100))
                c.write(d);
        });

        ss.push(svr.socket);
        svr.asyncRun();

        assert.deepEqual({
            "total": 0,
            "connections": 0,
            "accept": 0,
            "close": 0
        }, svr.stats.toJSON());

        var c1 = new net.Socket();
        c1.connect('127.0.0.1', 8812 + base_port);

        coroutine.sleep(10);
        assert.deepEqual({
            "total": 1,
            "connections": 1,
            "accept": 1,
            "close": 0
        }, svr.stats.toJSON());

        svr.stats.reset();
        assert.deepEqual({
            "total": 1,
            "connections": 1,
            "accept": 0,
            "close": 0
        }, svr.stats.toJSON());

        c1.close();

        // svr.stats.reset();
        coroutine.sleep(10);
        assert.deepEqual({
            "total": 1,
            "connections": 0,
            "accept": 0,
            "close": 1
        }, svr.stats.toJSON());
    });

    describe("abort Pending I/O", () => {
        function close_it(s) {
            coroutine.sleep(50);
            s.close();
        }

        it("abort connect", () => {
            var c1 = new net.Socket();
            coroutine.start(close_it, c1);
            assert.throws(() => {
                c1.connect('12.0.0.1', 8083 + base_port);
            });
        });

        it("abort accept", () => {
            var c1 = new net.Socket();
            c1.bind(8180 + base_port);
            c1.listen();

            coroutine.start(close_it, c1);

            assert.throws(() => {
                c1.accept();
            });
        });

        it("abort read", () => {
            var c1 = new net.Socket();
            c1.connect('127.0.0.1', 8080 + base_port);
            coroutine.start(close_it, c1);
            assert.throws(() => {
                c1.read();
            });
        });
    });

    it("isIP", () => {
        assert.strictEqual(net.isIP('127.0.0.1'), 4);
        assert.strictEqual(net.isIP('x127.0.0.1'), 0);
        assert.strictEqual(net.isIP('example.com'), 0);
        assert.strictEqual(net.isIP('0000:0000:0000:0000:0000:0000:0000:0000'), 6);
        assert.strictEqual(net.isIP('0000:0000:0000:0000:0000:0000:0000:0000::0000'), 0);
        assert.strictEqual(net.isIP('1050:0:0:0:5:600:300c:326b'), 6);
        assert.strictEqual(net.isIP('2001:252:0:1::2008:6'), 6);
        assert.strictEqual(net.isIP('2001:dead:beef:1::2008:6'), 6);
        assert.strictEqual(net.isIP('2001::'), 6);
        assert.strictEqual(net.isIP('2001:dead::'), 6);
        assert.strictEqual(net.isIP('2001:dead:beef::'), 6);
        assert.strictEqual(net.isIP('2001:dead:beef:1::'), 6);
        assert.strictEqual(net.isIP('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'), 6);
        assert.strictEqual(net.isIP(':2001:252:0:1::2008:6:'), 0);
        assert.strictEqual(net.isIP(':2001:252:0:1::2008:6'), 0);
        assert.strictEqual(net.isIP('2001:252:0:1::2008:6:'), 0);
        assert.strictEqual(net.isIP('2001:252::1::2008:6'), 0);
        assert.strictEqual(net.isIP('::2001:252:1:2008:6'), 6);
        assert.strictEqual(net.isIP('::2001:252:1:1.1.1.1'), 6);
        assert.strictEqual(net.isIP('::2001:252:1:255.255.255.255'), 6);
        assert.strictEqual(net.isIP('::2001:252:1:255.255.255.255.76'), 0);
        assert.strictEqual(net.isIP('::anything'), 0);
        assert.strictEqual(net.isIP('::1'), 6);
        assert.strictEqual(net.isIP('::'), 6);
        assert.strictEqual(net.isIP('0000:0000:0000:0000:0000:0000:12345:0000'), 0);
        assert.strictEqual(net.isIP('0'), 0);
        assert.strictEqual(net.isIP(), 0);
        assert.strictEqual(net.isIP(''), 0);
        assert.strictEqual(net.isIP(null), 0);
        assert.strictEqual(net.isIP(123), 0);
        assert.strictEqual(net.isIP(true), 0);
        assert.strictEqual(net.isIP({}), 0);
        assert.strictEqual(net.isIP({
            toString: () => '::2001:252:1:255.255.255.255'
        }), 6);
        assert.strictEqual(net.isIP({
            toString: () => '127.0.0.1'
        }), 4);
        assert.strictEqual(net.isIP({
            toString: () => 'bla'
        }), 0);
    });

    it("isIPv4", () => {
        assert.strictEqual(net.isIPv4('127.0.0.1'), true);
        assert.strictEqual(net.isIPv4('example.com'), false);
        assert.strictEqual(net.isIPv4('2001:252:0:1::2008:6'), false);
        assert.strictEqual(net.isIPv4(), false);
        assert.strictEqual(net.isIPv4(''), false);
        assert.strictEqual(net.isIPv4(null), false);
        assert.strictEqual(net.isIPv4(123), false);
        assert.strictEqual(net.isIPv4(true), false);
        assert.strictEqual(net.isIPv4({}), false);
        assert.strictEqual(net.isIPv4({
            toString: () => '::2001:252:1:255.255.255.255'
        }), false);
        assert.strictEqual(net.isIPv4({
            toString: () => '127.0.0.1'
        }), true);
        assert.strictEqual(net.isIPv4({
            toString: () => 'bla'
        }), false);
    });

    it("isIPv6", () => {
        assert.strictEqual(net.isIPv6('127.0.0.1'), false);
        assert.strictEqual(net.isIPv6('example.com'), false);
        assert.strictEqual(net.isIPv6('2001:252:0:1::2008:6'), true);
        assert.strictEqual(net.isIPv6(), false);
        assert.strictEqual(net.isIPv6(''), false);
        assert.strictEqual(net.isIPv6(null), false);
        assert.strictEqual(net.isIPv6(123), false);
        assert.strictEqual(net.isIPv6(true), false);
        assert.strictEqual(net.isIPv6({}), false);
        assert.strictEqual(net.isIPv6({
            toString: () => '::2001:252:1:255.255.255.255'
        }), true);
        assert.strictEqual(net.isIPv6({
            toString: () => '127.0.0.1'
        }), false);
        assert.strictEqual(net.isIPv6({
            toString: () => 'bla'
        }), false);
    });

    it("Memory Leak detect", () => {
        var ss, no1;
        GC();
        coroutine.sleep(100);
        GC();
        no1 = test_util.countObject('Socket');

        ss = new net.TcpServer(9812, (c) => {});
        coroutine.start(() => {
            ss.run();
        });

        coroutine.sleep(50);
        ss.stop();
        ss = undefined;
        coroutine.sleep(50);

        GC();
        assert.equal(no1, test_util.countObject('Socket'));

        ss = new net.TcpServer(9813, (c) => {});
        ss.asyncRun();

        coroutine.sleep(50);
        ss.stop();
        ss = undefined;
        coroutine.sleep(50);

        GC();
        assert.equal(no1, test_util.countObject('Socket'));

        (() => {
            var s = new net.TcpServer(9884, () => {});
        })();

        coroutine.sleep(50);

        GC();
        assert.equal(no1, test_util.countObject('Socket'));
    });

    if (global.full_test)
        describe("Smtp", () => {
            var s;

            it("new & connect", () => {
                s = new net.Smtp();
                s.connect("tcp://smtp.ym.163.com:25");
                s.socket.close();
            });

            it("net.openSmtp", () => {
                s = net.openSmtp("tcp://smtp.exmail.qq.com:25");
            });

            it("command", () => {
                assert.equal(s.command("HELO", "baoz.me").substr(0, 4),
                    "250 ");

                assert.throws(() => {
                    s.command("FUCK", "baoz.me");
                });
            });

            it("hello", () => {
                s.hello();
            });

            xdescribe("Auth", () => {
                it("login", () => {
                    s.login("lion@baoz.cn", "");
                });

                it("from", () => {
                    s.from("lion@baoz.cn");
                });

                it("to", () => {
                    s.to("lion@baoz.cn");
                });

                it("data", () => {
                    s.data("from:lion@baoz.cn\r\n" + "to:lion@baoz.cn\r\n" + "subject:test title\r\n\r\n" + "test text");
                });
            });

            it("quit", () => {
                s.quit();
            });
        });
});

require.main === module && test.run(console.DEBUG);