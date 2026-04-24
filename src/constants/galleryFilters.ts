/** 分类筛选：按标题/描述关键词匹配；上传标签须使用这些 label */
export const GALLERY_CATEGORY_FILTERS: { label: string; keywords: string[] }[] = [
  { label: "动物", keywords: ["动物", "猫", "狗", "鸟", "兽", "宠物"] },
  { label: "风景", keywords: ["风景", "山", "海", "湖", "自然", "天空", "建筑"] },
  { label: "文化", keywords: ["文化", "艺术", "历史", "博物", "传统"] },
  { label: "娱乐", keywords: ["娱乐", "游戏", "音乐", "电影"] },
  { label: "生活", keywords: ["生活", "日常", "人像", "街拍"] },
  { label: "科技", keywords: ["科技", "数码", "代码", "程序"] },
  { label: "美食", keywords: ["美食", "食物", "餐饮"] },
  { label: "运动", keywords: ["运动", "体育", "健身"] },
];

export const GALLERY_TAG_LABELS = GALLERY_CATEGORY_FILTERS.map((f) => f.label);
