const CONF = {
    port: process.env.STJH_PORT || "5758",
    rootPathname: "",
    appId: process.env.STJH_WX_APPID || "wx330289dfb27d4663",
    appSecret: process.env.STJH_WX_APPSECRET || "",
    db: {
        client: "mysql",
        connection: {
            host: process.env.STJH_DB_HOST || "bj-cdb-qsje654b.sql.tencentcdb.com",
            user: process.env.STJH_DB_USER || "root",
            port: process.env.STJH_DB_PORT || 63278,
            password: process.env.STJH_DB_PASSWORD || "",
            database: process.env.STJH_DB_NAME || "qcode_review",
            dateStrings: true
        },
        pool: { min: 2, max: 10, idleTimeoutMillis: 30000 }
    },
    cos: { region: "ap-guangzhou", fileBucket: "qcloudtest", uploadFolder: "" },
    wxLoginExpires: 7200,
    wxMessageToken: process.env.STJH_WX_MSG_TOKEN || "abcdefgh",
    vercodelong: 600,
    qrLink: "http://stjx.goodluckpacking.com/qcode?id=4"
};
module.exports = CONF;
