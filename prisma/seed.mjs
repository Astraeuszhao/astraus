import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

/** 画廊分类标签（须与白名单一致） */
const TAGS = ["动物", "风景", "文化", "娱乐", "生活", "科技", "美食", "运动"];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function pickTags() {
  const n = Math.random() < 0.35 ? 2 : 1;
  const shuffled = [...TAGS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function publicUidForIndex(i) {
  return String(880000000000 + i + 1);
}

/**
 * 10 个拟真账号：邮箱 / 用户名 / 昵称 / 简介 / 每人 5 条帖子文案
 */
const DEMO_PASSWORD = "Photo2026!";

const personas = [
  {
    email: "chenwei.k@163.com",
    username: "chen_wei_k",
    nickname: "陈蔚",
    bio: "周末才想起来相机里有电池。扫街为主，调色随缘，别问参数问就是凭感觉。",
    posts: [
      { title: "路口红灯停太久，随手按了一张", description: "构图其实歪了，但莫名顺眼。那天风大，头发糊一脸。" },
      { title: "楼下便利店门口的猫", description: "老板说它叫油条，性格比我还懒。拍的时候在打哈欠。" },
      { title: "傍晚天台，对面楼亮灯像棋盘", description: "本来想等蓝调时刻结果饿先去吃饭了，回来只剩这摊灰紫。" },
      { title: "地铁里睡着的陌生人", description: "没露脸。包上还挂着去年漫展的徽章，有点可爱。" },
      { title: "雨后水坑里的霓虹倒影", description: "蹲得膝盖疼，路人以为我在捡钱。" },
    ],
  },
  {
    email: "xiaohe1990@qq.com",
    username: "lin_xiaohe",
    nickname: "林晓禾",
    bio: "人在杭州，拍照是为了记住吃了啥。修图？不存在的，最多拉一下曝光。",
    posts: [
      { title: "灵隐附近一家无名小馆的拌面", description: "辣椒油放多了，辣到失忆，但照片看着很温和。" },
      { title: "西湖边被风吹乱的柳条", description: "游客太多，裁切拯救世界。" },
      { title: "深夜便利店关东煮蒸汽", description: "玻璃起雾，对不上焦，算了就这样。" },
      { title: "朋友婚礼抓拍，新郎表情失控", description: "已征得同意才发（大概）。这张点赞应该算他的。" },
      { title: "老家院子里的枇杷树", description: "我妈让我拍清楚叶子，我拍糊了她说挺好有氛围。" },
    ],
  },
  {
    email: "shawnzhou@outlook.com",
    username: "zhou_yuan",
    nickname: "周予安",
    bio: "伪胶片爱好者，真穷。设备是五年前的残幅，心态是旗舰全幅。",
    posts: [
      { title: "老小区外墙剥落的蓝漆", description: "颜色像小时候用的水彩盒，晒干那种。" },
      { title: "公园里练太极的大爷背影", description: "动作比我的人生规划还流畅。" },
      { title: "高架下穿过的一束光", description: "灰尘在光里飘，过敏患者慎看。" },
      { title: "书店角落堆过高的二手书", description: "抽一本可能会塌方，没敢动。" },
      { title: "冬天哈气在车窗上画的丑心", description: "司机师傅从后视镜瞪我，我赶紧擦了。" },
    ],
  },
  {
    email: "sunian.photo@gmail.com",
    username: "su_nian_7",
    nickname: "苏念",
    bio: "拍照三分钟，删图两小时。简介写太长没人看，写太短显得高冷，随便吧。",
    posts: [
      { title: "咖啡馆窗边的杯子印子", description: "像某种抽象地图，其实只是水渍。" },
      { title: "夜市烤鱿鱼摊的烟", description: "呛，但香。站在下风口拍的，代价是头发腌入味。" },
      { title: "地铁换乘通道的广告灯箱", description: "色温乱成一团，后期救回来一点，剩一点当性格。" },
      { title: "小区健身器材区的小孩", description: "爬得比我还高，我在下面捏冷汗。" },
      { title: "凌晨四点半的空马路", description: "失眠产物。路灯颜色各管各的，城市没睡醒。" },
    ],
  },
  {
    email: "qingye.z@126.com",
    username: "zhao_qingye",
    nickname: "赵清野",
    bio: "山里长大的，进城以后拍什么都像游客。粉丝数是假的，心情是真的。",
    posts: [
      { title: "高铁站玻璃上的雨痕", description: "列车晚点四十分钟，成就这张。" },
      { title: "菜市场水产区的泡沫箱", description: "腥味扑面而来，手机屏都是雾。" },
      { title: "旧书店老板的猫趴在收银机上", description: "猫不理人，老板也不理讲价。" },
      { title: "夏天柏油马路热浪扭曲远楼", description: "长焦压缩之后像劣质特效，我喜欢。" },
      { title: "乡下亲戚家晒的辣椒串", description: "红得太嚣张，曝光差点炸。" },
    ],
  },
  {
    email: "han.lu@icloud.com",
    username: "hanlu_88",
    nickname: "韩露",
    bio: "健身卡办了三年，去拍照的次数比去举铁多。别问，问就是在有氧。",
    posts: [
      { title: "健身房镜子里的杠铃片", description: "反光里还有我凌乱的发带。" },
      { title: "晨跑完路边早餐铺蒸笼", description: "白雾和晨光抢戏，白雾赢了。" },
      { title: "篮球场边喝了一半的运动饮料", description: "凝结水珠比球赛好看，可能我不懂球。" },
      { title: "瑜伽垫卷角和地板缝对齐失败", description: "强迫症看了会难受，我故意的（不是）。" },
      { title: "夜跑时耳机线打结（时代眼泪）", description: "现在都用蓝牙了，这张当考古。" },
    ],
  },
  {
    email: "wutong@foxmail.com",
    username: "wutong_pic",
    nickname: "吴桐",
    bio: "设计民工，拍照当解压。色彩偏好很主观，不喜欢的请静音划走谢谢合作。",
    posts: [
      { title: "工位显示器色卡贴纸边角", description: "甲方说再亮一点，我说再亮就过曝了，最后谁也没赢。" },
      { title: "公司楼下雕塑被鸽子占领", description: "雕塑表情麻木，鸽子的表情更麻木。" },
      { title: "打印店门口一摞铜版纸", description: "边缘起毛，像某种工业绒毛。" },
      { title: "深夜加班电梯里的广告屏", description: "数字在跳，我在发呆，快门声吓自己一跳。" },
      { title: "会议室白板没擦干净的笔迹", description: "像密码，其实是上周的需求。" },
    ],
  },
  {
    email: "tang_shi_01@163.com",
    username: "tang_shi_pic",
    nickname: "唐诗",
    bio: "名字像古人，其实在写代码。Git 提交比快门勤快，两者都经常后悔。",
    posts: [
      { title: "机械键盘一颗掉漆的键帽", description: "高频键，W 还是 E 忘了，反正很沧桑。" },
      { title: "显示器反射的窗外阴天", description: "代码没保存，心情和天一样灰。" },
      { title: "服务器机房走廊冷光", description: "进去要登记，出来耳朵嗡嗡。" },
      { title: "咖啡渍在鼠标垫上的形状", description: "有人说像国家地图，我看像翻车现场。" },
      { title: "手机充电线缠绕哲学", description: "解不开的那种，拍下来当行为艺术。" },
    ],
  },
  {
    email: "yifan.jia@qq.com",
    username: "yifan_jia",
    nickname: "贾一凡",
    bio: "在读研究生，论文和快门一样拖稿。照片比摘要好写多了。",
    posts: [
      { title: "图书馆靠窗座位上的光斑", description: "占座的水杯不是我的，不敢动。" },
      { title: "食堂新出的紫薯馒头", description: "颜色像滤镜开太过，吃起来正常。" },
      { title: "操场夜跑的人影拖长", description: "慢门手持，糊了，美其名曰动感。" },
      { title: "实验室门口换鞋凳磨损痕迹", description: "岁月和鞋底共同完成的作品。" },
      { title: "快递站堆成小山的盒子", description: "双十一后遗症，现在才拍是因为才理完。" },
    ],
  },
  {
    email: "luoqi.camera@sina.com",
    username: "luo_qi_snap",
    nickname: "罗琦",
    bio: "刚换工作，压力大就拍照。粉丝数别信，那是我瞎填着玩的（后台也别信）",
    posts: [
      { title: "新公司工牌挂绳打结特写", description: "入职第一天，结打得很专业，心情不专业。" },
      { title: "外卖袋上的油渍形状像小岛", description: "饿的时候看什么都像吃的。" },
      { title: "出租屋窗台一盆半死不活的多肉", description: "浇多了烂根，浇少了蔫，跟我同步。" },
      { title: "雨夜共享单车车座积水", description: "没坐，拍了就走，功德+1。" },
      { title: "便利店冰柜门起雾里的饮料排列", description: "选恐发作，最后拿了最左边那瓶。" },
    ],
  },
];

async function downloadImage(url, destPath) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`fetch ${url} ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
}

async function main() {
  console.log("清空数据库（点赞、图片、关注、用户）…");
  await prisma.imageLike.deleteMany();
  await prisma.image.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (fs.existsSync(uploadsDir)) {
    for (const f of fs.readdirSync(uploadsDir)) {
      fs.unlinkSync(path.join(uploadsDir, f));
    }
  } else {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  let imageCounter = 0;
  let totalPosts = 0;

  for (let i = 0; i < personas.length; i++) {
    const p = personas[i];
    const followerCount = randInt(12, 28490);
    const user = await prisma.user.create({
      data: {
        email: p.email,
        username: p.username,
        publicUid: publicUidForIndex(i),
        nickname: p.nickname,
        password: hashed,
        bio: p.bio,
        followerCount,
        muted: false,
      },
    });

    for (let j = 0; j < p.posts.length; j++) {
      const post = p.posts[j];
      const fname = `seed-${p.username}-${j}.jpg`;
      const diskPath = path.join(uploadsDir, fname);
      const seedKey = `as-${p.username}-${j}-${imageCounter}`;
      await downloadImage(
        `https://picsum.photos/seed/${encodeURIComponent(seedKey)}/900/650`,
        diskPath,
      );

      const likeCount = randInt(3, 4208);
      const tags = pickTags();

      await prisma.image.create({
        data: {
          title: post.title,
          description: post.description,
          tags,
          url: `/uploads/${fname}`,
          userId: user.id,
          likeCount,
        },
      });
      imageCounter += 1;
      totalPosts += 1;
    }
  }

  console.log("");
  console.log(`完成：${personas.length} 个用户，${totalPosts} 条帖子（每人 5 条）。`);
  console.log("粉丝数、点赞数为随机写入，与真实关注/点赞表无关。");
  console.log(`统一登录密码：${DEMO_PASSWORD}`);
  console.log("示例账号（任选）：chen_wei_k / lin_xiaohe / zhou_yuan …（邮箱见 seed 内 personas）");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
