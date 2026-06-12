# SAD — Supramolecular Assembly Database

> 超分子组装体数据库
> 
> 服务器：阿里云 新加坡 | `47.84.101.94` | Ubuntu 24.04 | 2 vCPU / 4GB / 50GB
> 
> 技术栈：FastAPI + SQLite + React + Nginx + Docker

---

## 目录结构

```
web_dev/
├── backend/
│   ├── main.py              # FastAPI 路由
│   ├── models.py            # SQLAlchemy 数据模型
│   ├── schemas.py           # Pydantic 输入/输出定义
│   ├── crud.py              # 数据库增删改查
│   ├── database.py          # 数据库连接配置
│   ├── import_excel.py      # Excel 导入脚本（53列新模板）
│   ├── requirements.txt     # Python 依赖
│   ├── Dockerfile           # 后端容器构建
│   └── data/                # SQLite DB + 上传文件（容器内）
├── frontend/
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   │   ├── SearchPage.tsx    # 搜索/首页（卡片网格）
│   │   │   ├── DetailPage.tsx    # 组装体详情
│   │   │   ├── BrowsePage.tsx    # 浏览全部
│   │   │   ├── UploadPage.tsx    # 管理（上传/删除）
│   │   │   └── WorkbenchPage.tsx # 工作台
│   │   ├── components/      # 通用组件（Layout, Toast, ThemeToggle, LanguageToggle）
│   │   ├── context/         # 翻译、主题上下文
│   │   ├── api/client.ts    # API 调用封装
│   │   └── types/index.ts   # TypeScript 类型定义
│   ├── public/images/       # 化合物图片（构建时 → dist/images/）
│   └── package.json
├── data/
│   └── 260611_超分子数据库整理_修改(2).xlsx   # Excel 数据源（53列/3行合并表头）
├── scripts/
│   └── deploy.sh            # 一键部署脚本
├── docker-compose.yml       # 服务编排（backend + nginx）
├── nginx.conf               # Nginx 配置（静态文件 + API 反向代理）
└── .gitignore
```

---

## 首次部署

在全新 Ubuntu 24.04 服务器上：

```bash
apt update && apt install -y curl
bash <(curl -fsSL https://raw.githubusercontent.com/Aoppp/SUPRA/main/scripts/deploy.sh)
```

脚本自动完成：Docker → Node.js → 克隆项目 → 构建前端 → 启动服务 → 导入数据。

---

## 日常更新

### 改代码（页面/功能/样式）

```bash
# Mac 本地
cd ~/Desktop/web_dev
# ... 修改代码 ...
git add -A && git commit -m "描述改动" && git push

# SSH 到服务器
ssh root@47.84.101.94
cd /opt/sad
git pull
cd frontend && npm install && npm run build && cd ..
docker compose up -d --build
```

### 更新数据（Excel）

直接在网页操作：`http://47.84.101.94` → 管理 → 上传 Excel 或批量导入。

服务器自动解析、提取图片、写入数据库。无需 SSH。

### 仅更新后端

```bash
ssh root@47.84.101.94
cd /opt/sad && git pull && docker compose up -d --build backend
```

### 仅更新前端

```bash
ssh root@47.84.101.94
cd /opt/sad && git pull && cd frontend && npm install && npm run build
# nginx 直接读取 dist/，无需重启容器
```

---

## 数据备份

### 自动备份

每天凌晨 3:00 自动备份 SQLite 数据库到 `/opt/backups/`，保留最近 30 天。

### 手动备份

```bash
ssh root@47.84.101.94
/opt/sad/scripts/backup.sh
```

### 恢复数据

```bash
ssh root@47.84.101.94
docker compose -f /opt/sad/docker-compose.yml cp /opt/backups/dolphin-YYYYMMDD_HHMM.db backend:/app/data/dolphin.db
docker compose -f /opt/sad/docker-compose.yml restart backend
```

### 下载备份到本地

```bash
scp root@47.84.101.94:/opt/backups/dolphin-YYYYMMDD_HHMM.db ~/Desktop/
```

---

## 常用命令

| 操作 | 命令（SSH 到服务器后） |
|------|----------------------|
| 查看容器状态 | `docker compose -f /opt/sad/docker-compose.yml ps` |
| 查看后端日志 | `docker compose -f /opt/sad/docker-compose.yml logs backend --tail 50` |
| 重启服务 | `docker compose -f /opt/sad/docker-compose.yml restart` |
| 重新导入数据 | `docker compose -f /opt/sad/docker-compose.yml exec backend python import_excel.py` |
| 查看备份列表 | `ls -lht /opt/backups/` |

---

## 端口与安全

- **80** — Nginx（Web 服务）
- 阿里云安全组需开放 80 端口（`0.0.0.0/0`）
- 管理页密码：`Chaofenzi`（`frontend/src/pages/UploadPage.tsx` 修改）

---

## 故障排查

| 现象 | 可能原因 | 解决 |
|------|---------|------|
| 502 Bad Gateway | 后端容器崩溃 | `docker compose logs backend` 查看错误日志 |
| 图片不显示 | 导入时图片提取失败 | 在本地运行 `import_excel.py`，将 DB + images 上传服务器 |
| 搜索无结果 | 数据库为空 | `docker compose exec backend python import_excel.py` |
| Docker 命令不存在 | 未安装 | `apt install -y docker.io` |
| git push 失败 | HTTPS 连接问题 | 切换 SSH：`git remote set-url origin git@github.com:Aoppp/SUPRA.git` |

---

## 技术要点

- **数据库**：SQLite（单文件 `dolphin.db`），存储在 Docker volume `sad_app_data` 中，容器重建不会丢失
- **图片**：Excel 嵌入图片 → `import_excel.py` 提取 → `frontend/public/images/` → 构建时复制到 `dist/images/` → Nginx 直接服务
- **图片提取兼容**：`import_excel.py` 优先用 openpyxl `_images`（macOS/Windows），失败时 fallback 到 ZIP 解析（Linux）
- **分类标签**：`is_food`/`is_cosmetic`/`is_drug` 三个布尔字段，前端动态生成标签和 foodmate 链接
- **语言**：`frontend/src/context/translations.ts` 维护中英文翻译键值对

---

*最后更新：2026-06-12*
