const config = require("../config");
const knex = require("knex")(config.db);

module.exports = {
  /**
   * /zuishu.php — H5 扫码追溯查询
   * 
   * QR 码格式: http://stjx.goodluckpacking.com/qcode?id=4{zhuisuID(12)}{Qcode(8)}
   * 入参 zhuisuID 为 21 位: "4" + 12位zhuisuID + 8位Qcode
   * 实际查库用前 12 位 zhuisuID
   */
  s_zuishu: async (ctx) => {
    const rawID = (ctx.request.query.zhuisuID || "").trim();

    if (!rawID || rawID.length < 13) {
      ctx.response.body = { code: 0, error: "追溯码不正确" };
      return;
    }

    // 去掉前缀 "4"，取前 12 位作为 zhuisuID
    const stripped = rawID.startsWith("4") ? rawID.slice(1) : rawID;
    const zhuisuID = stripped.substring(0, 12);

    try {
      // 先查 reviewinfo LEFT JOIN userinfo（获取完整生产经营者信息）
      const data = await knex("reviewinfo")
        .leftJoin("userinfo", "reviewinfo.kehuid", "userinfo.id")
        .select(
          "reviewinfo.*",
          "userinfo.jingyingzhe",
          "userinfo.xukezheng",
          "userinfo.dizhi",
          "userinfo.lianxifangshi",
          "userinfo.wangzhi",
          "userinfo.telephone"
        )
        .where("reviewinfo.zhuisuID", zhuisuID)
        .limit(1);

      if (data.length === 0) {
        // 回退查 outQcode
        const outData = await knex("outQcode")
          .select("*")
          .where("zhuisuID", zhuisuID)
          .limit(1);

        if (outData.length === 0) {
          ctx.response.body = { code: 0, error: "追溯码生成记录查询失败!" };
          return;
        }

        // outQcode 没有 userinfo 关联，尝试补充
        const kehuid = outData[0].kehuid;
        if (kehuid) {
          const user = await knex("userinfo").where("id", kehuid).first();
          if (user) {
            outData[0].jingyingzhe = user.jingyingzhe;
            outData[0].xukezheng = user.xukezheng;
            outData[0].dizhi = user.dizhi;
            outData[0].lianxifangshi = user.lianxifangshi;
            outData[0].wangzhi = user.wangzhi;
            outData[0].telephone = user.telephone;
          }
        }

        // 更新扫描次数（字段可能不存在）
        try {
          await knex("outQcode")
            .where("id", outData[0].id)
            .increment("scancount", 1);
        } catch (_) { /* scancount 字段可能不存在 */ }

        ctx.response.body = { code: 1, data: outData };
        return;
      }

      // 更新扫描次数（字段可能不存在，忽略错误）
      try {
        await knex("reviewinfo")
          .where("id", data[0].id)
          .increment("scancount", 1);
      } catch (_) { /* scancount 字段可能不存在 */ }

      ctx.response.body = { code: 1, data: data };

    } catch (e) {
      console.error("/zuishu.php error:", e);
      ctx.response.body = { code: 0, error: "追溯失败" };
    }
  },
};
