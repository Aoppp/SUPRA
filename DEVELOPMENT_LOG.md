# SAD — 超分子组装体数据库 开发全记录

## 项目概述

- **全称：** SAD — Supramolecular Assembly Database（超分子组装体数据库）
- **用途：** 存储、检索、管理超分子组装体研究数据，支持食品/化妆品/药品应用分类
- **数据量：** 82 条化合物组装体记录，含 73+ 分子结构图片
- **合作单位：** 武汉大学、武汉轻工大学、王叔和生物科技

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS 4 |
| 后端 | FastAPI + SQLAlchemy + SQLite |
| 部署 | Docker Compose（nginx:alpine + FastAPI）|
| 化学 | RDKit（SMILES → 2D 结构图生成）|
| Excel | openpyxl + ZIP fallback（图片提取）|
| 服务器 | 阿里云新加坡，Ubuntu 24.04 |

---

## 项目结构

```
web_dev/
├── backend/
│   ├── main.py              # FastAPI 路由（18 个端点）
│   ├── models.py             # SQLAlchemy 数据模型（8 个表）
│   ├── schemas.py            # Pydantic 请求/响应模型
│   ├── crud.py               # 数据库操作逻辑
│   ├── database.py           # 数据库连接配置
│   ├── import_excel.py       # Excel 数据导入脚本
│   ├── Dockerfile            # 后端容器镜像
│   └── requirements.txt      # Python 依赖
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # 路由 + 代码分割入口
│   │   ├── pages/
│   │   │   ├── SearchPage.tsx   # 搜索页（首页）
│   │   │   ├── BrowsePage.tsx   # 浏览全部
│   │   │   ├── DetailPage.tsx   # 详情页
│   │   │   ├── UploadPage.tsx   # 管理（上传/删除）
│   │   │   └── WorkbenchPage.tsx # 工作台
│   │   ├── api/client.ts     # API 调用封装
│   │   ├── context/
│   │   │   ├── LanguageContext.tsx  # 中英文切换
│   │   │   ├── ThemeContext.tsx     # 暗色/亮色主题
│   │   │   └── translations.ts     # 中英文翻译键
│   │   ├── components/
│   │   │   ├── Layout.tsx    # 页面布局（导航 + 页脚）
│   │   │   └── Toast.tsx     # 操作反馈提示
│   │   └── types/index.ts   # TypeScript 类型定义
│   ├── vite.config.ts        # Vite 构建配置
│   └── dist/                 # 构建产物
├── nginx.conf                 # Nginx 反向代理配置
├── docker-compose.yml         # 容器编排
├── scripts/deploy.sh          # 一键部署脚本
├── CLAUDE.md                  # 项目约束与部署说明
└── MAINTENANCE.md             # 维护手册
```

---

## 开发阶段

### 阶段一：项目初始化（v1.0 基线）

**目标：** 从零搭建可用的超分子组装体数据库

- 快速上手 FastAPI + SQLAlchemy + SQLite 后端
- React 18 + Vite + Tailwind CSS 4 前端
- 导入 75 条化合物记录（含图片提取）
- 实现搜索、详情、上传、工作台基础页面
- 中英文双语 + 暗色/亮色主题切换

**关键提交：** `18b174e` SUPRA v1.0

---

### 阶段二：功能补全（管理面板与删除）

**新增功能：**

| 功能 | 说明 |
|------|------|
| 管理面板 | 上传页改名为"管理"，密码保护（`Chaofenzi!`）|
| 删除功能 | 按 CAS 号搜索 → 点击删除 → 二次确认弹窗 |
| 批量上传 | 在线 Excel 上传 + 图片提取 + 数据导入 |
| 目录标签 | 食品/化妆品/药品分类标签，foodmate GB 2760 链接 |
| 结构图 | RDKit 从 SMILES 生成 2D 化学结构图 |

**关键提交：** `19f1d59` → `3fc1e7d`

**遇到的问题与解决：**

| 问题 | 原因 | 解决 |
|------|------|------|
| 删除确认流程不直观 | 两阶段确认（点击删除 → 弹窗确认）| 简化为单步弹窗 + 明确警告文字 |
| Docker 部署缺少依赖 | `python-multipart` 未安装 | 加入 requirements.txt |
| Linux 服务器图片提取失败 | openpyxl 的 `_images` 在 Linux 上行为异常 | 添加 ZIP fallback：直接解析 xlsx 内部的 `xl/drawings/` + `xl/media/` |
| 上传文件路由不可用 | nginx 未代理 uploads 路径 | 移除多余的 volume 挂载，统一通过 proxy_pass 到 backend |

---

### 阶段三：v2.0 数据结构重构

**背景：** Excel 模板从 24 列升级为 53 列（3 行合并表头），旧数据模型完全不兼容。

**数据库模型变更：**

Assembly 表新增 21 个字段：
```
is_cosmetic / cosmetic_note, is_drug / drug_note, is_food / food_note
food_category, food_daily_intake, regulations
aqueous_phase, organic_phase, component_ratio
assembly_drive_method_id (FK → 新表 assembly_drive_methods)
responsiveness, surface_modification
size_note, size_source, temperature_note, ph_note
component_count, url
```

删除冗余字段：`description`, `solvent`

新增参照表：`assembly_drive_methods`

**导入脚本重写：**

- 跳过前 3 行合并表头，从第 4 行读数据
- 54 条目中英文表头映射（`CH_HEADER_MAP`）
- 智能布尔值解析（"是"/"否" → bool，"无" → None）
- 粒径范围解析（`222.0±7.57`, `200–300`, `50`）
- 分号分隔的多值字段（驱动力、性质）
- 化合物类型名称规范化（"生物碱类" → "生物碱"）

**前端重构：**

| 页面 | 变更 |
|------|------|
| SearchPage | 表格 → 卡片网格，应用分类标签筛选（全部/食品/化妆品/药品），可折叠高级筛选 |
| DetailPage | 6 区块结构化布局（分子信息/应用分类/组装参数/溶剂体系/物理性质/生物活性）|
| UploadPage | 44 字段表单，8 个可折叠区块，文件图片上传，驱动力/性质多选 |
| BrowsePage | 卡片网格 + URL 分页 |

**API 变更：**
- 新增 `/api/assembly-drive-methods`
- search 接口新增 10+ 筛选参数
- category 和 foodmate_url 从数据库字段动态计算

**关键提交：** `32609da` feat: SAD v2.0

---

### 阶段四：细节打磨与体验优化

**品牌与文案：**
- 项目名从 SUPRA 改为 SAD
- 页脚修正：英文 "Supramolecular Assembly Database"，加入武汉大学
- 移除了所有 emoji 字符（作为项目约束写入 CLAUDE.md）

**删除 Characterization Method：**

用户发现 Excel 数据源没有"表征方法"列，但我们却添加了下拉选择框。
处理方式：从模型、接口、前端全部移除相关代码。
教训：不要添加数据源里不存在的列。

**关键提交：** `bb9ca85`, `9a6ab76`

---

## 重点问题深度解决

### 问题 1：返回不回到原页面位置

**现象：** 从详情页返回后，总是跳到首页第 1 页，而非之前浏览的页面。

**根因：** `SearchPage` 的 `useEffect(() => doSearch(1), [])` 初始化时无视 URL 参数，强制查第 1 页。详情页用 `<Link to="/">` 硬跳转到首页。

**解决步骤：**

```
第一步（提交 aa61d00）：
  - 详情页 back 改为 navigate(-1)
  - 搜索页从 URL parameter 读取 page 参数
  - 分页按钮更新 URL searchParams

第二步（提交 73d2b15）：
  - 添加 sessionStorage 缓存滚动位置
  - 点击卡片时保存 window.scrollY
  - 返回时恢复滚动位置

第三步（提交 d08a41d）：
  - 发现 useEffect 恢复滚动仍有可视闪烁
  - 改为 useLayoutEffect（在浏览器绘制前执行）
  - 关键：必须在第一次渲染前同步恢复位置
```

**仍有问题：** 尽管用了 `useLayoutEffect`，页面仍然有滚动动画。

---

### 问题 2：CSS scroll-behavior 导致的滚动动画

**现象：** `useLayoutEffect` 中调用 `window.scrollTo(0, saved)` 仍然产生可见的滚动动画。

**排查过程：**
1. 怀疑 `useLayoutEffect` 执行时机问题 → 加入 `useRef` 确保只执行一次
2. 怀疑 React 渲染时机 → 尝试多种生命周期组合
3. 逐个排查 CSS → 发现 `index.css` 第 14 行：
   ```css
   html {
     scroll-behavior: smooth;
   }
   ```

**根因：** Tailwind 默认的 `scroll-behavior: smooth` 使所有 `window.scrollTo()` 调用变成平滑滚动动画，包括 JS 触发的。

**最终解决（提交 de6de51）：**
```typescript
// 之前（有动画）
window.scrollTo(0, saved);

// 修复（无动画）
window.scrollTo({ top: saved, behavior: 'instant' });
```

`behavior: 'instant'` 覆盖了 CSS 的 `smooth` 默认值。

---

### 问题 3：跨域网络延迟

**现象：** 新加坡服务器从中国访问 TTFB 高达 2.4 秒。

**排查结果：**
- ping 测试：287-427ms RTT，20% 丢包
- 服务器本地测试：10ms 响应（服务极快）
- 根因：中国到新加坡跨境网络延迟 + GFW 干扰

**优化措施（提交 09e56c1）：**

| 优化 | 效果 |
|------|------|
| React.lazy 路由级代码分割 | 初始 JS 从 313KB 拆分为 14KB + 按需加载 |
| vendor chunk 分离 | React/ReactDOM/ReactRouter(231KB) 永久缓存 |
| nginx immutable 缓存头 | 静态资源 1 年缓存，index.html no-cache |
| nginx upstream keepalive | 复用后端连接，减少 TCP 握手 |
| gzip_static + vary | 预压缩文件直接返回 |

**效果：** TTFB 从 2.4s 降到 1.77s（冷连接）/ 0.5s（热连接）。
**剩余瓶颈：** TCP 三次握手跨新加坡约 1 秒，需迁移服务器才能根治。

---

### 问题 4：批量上传重复数据

**现象：** 批量导入 Excel 时数据翻倍。

**根因：** `main.py:302-305` 每行被 `append` 了两次：
```python
if any(v for v in row.values()):
    rows.append(row)      # 第一次
if any(v for v in row.values()):
    rows.append(row)      # 第二次 ← 复制粘贴错误
```

**修复：** 删除重复的 append 块。

---

### 问题 5：批量导入数据丢失风险

**现象：** 如果 Excel 解析出错，数据库旧数据已全部丢失。

**根因：** `crud.py:248-249` 在循环导入前立即 `DELETE + COMMIT`：
```python
db.query(Assembly).delete()
db.commit()   # 立即提交！数据已永久删除
# ... 之后才开始导入新数据
```

**修复：**
1. 先导入所有行（在同一事务中）
2. 导入成功后再清除旧数据（按 ID 精确删除）
3. 全部操作在一个事务中，失败即回滚

```python
old_ids = {a.id for a in db.query(Assembly).all()}
# ... 循环导入新数据 ...
if created > 0:
    db.query(Assembly).filter(Assembly.id.in_(old_ids)).delete()
    db.commit()  # 一次性提交
```

---

### 问题 6：删除不清理图片文件

**现象：** 删除 assembly 只删数据库行，`data/images/` 下的图片成为孤儿文件。

**修复（`main.py` 删除端点）：**
```python
if a.compound_image and a.compound_image.startswith("/images/"):
    img_path = os.path.join(IMAGES_DIR, os.path.basename(a.compound_image))
    if os.path.exists(img_path):
        os.remove(img_path)
```

---

### 问题 7：Docker 部署路径问题

**现象：** `docker compose` 命令需要正确的上下文目录。

**解决：** 必须在 `/opt/sad` 目录下运行 `docker compose`，因为 `docker-compose.yml` 使用相对路径 mount `./frontend/dist` 和 `./nginx.conf`。

部署命令必须：
```bash
cd /opt/sad && docker compose restart nginx
# 不能：docker compose -f /opt/sad/docker-compose.yml restart nginx（路径解析不同）
```

---

### 问题 8：Git push HTTPS 卡住

**现象：** HTTPS 推送在跨境网络下超时。

**解决：** 改用 SSH：`git@github.com:Aoppp/SUPRA.git`

---

## 架构设计决策

### 1. SQLite 而非 PostgreSQL
- 数据量小（82 条），单用户场景
- 无需额外容器，部署简单
- 备份方便（复制单个 `.db` 文件）

### 2. SQLAlchemy joinedload 预加载
- 搜索和详情接口使用 `joinedload` 避免 N+1 查询
- 关联数据（building_block, morphology, driving_forces, properties 等）一次性加载

### 3. Nginx 反向代理而非直接暴露 FastAPI
- 静态文件由 nginx 直接服务（零延迟）
- API 路径 `/api/` 代理到 backend:8000
- Gzip 压缩和缓存头统一在 nginx 层处理

### 4. sessionStorage 缓存策略
- 搜索状态 + 滚动位置缓存到 sessionStorage
- 返回时瞬间恢复，不重新请求 API
- 关闭标签页自动清除（sessionStorage 特性）

### 5. 前端密码保护
- 管理页密码存储在 JS 常量中（明文，低安全需求）
- sessionStorage 保存认证状态
- 适合内部使用的简单场景

---

## 完整提交历史

```
09e56c1 正式 V1.0.0 — 代码分割、缓存优化、上传/删除逻辑修复
de6de51 fix: use scrollTo behavior:instant to override CSS scroll-behavior:smooth
e9a5c6a feat: cache page data in sessionStorage for instant back navigation
d08a41d fix: use useLayoutEffect for instant scroll restoration with no visible jump
73d2b15 feat: restore scroll position when returning from detail page
93c1852 fix: SearchPage now reads initial page from URL on mount
aa61d00 fix: persist page number in URL, back button returns to previous page
9a6ab76 fix: remove characterization method, unify detail/card image display
bb9ca85 fix: remove all emojis, add project CLAUDE.md with no-emoji constraint
4893f15 feat: default Chinese, expanded single upload form with image upload, batch image extraction, Chinese header mapping
a12da39 fix: update footer English to Supramolecular Assembly Database
36fcb34 fix: add WHU to footer
97567c6 feat: BrowsePage card grid, structure images, RDKit support
368b4ea chore: add MAINTENANCE.md, clean up unused files
9dbca4c fix: add ZIP-based image extraction fallback for Linux compatibility
27fea20 fix: add missing python-multipart dependency
56a9c1b fix: remove uploads volume mount from nginx (already proxied to backend)
32609da feat: SAD v2.0 — full-stack restructure for new 53-column data model
13dee26 feat: Dockerize stack, env-based config switching, production readiness
3fc1e7d feat: batch Excel upload, category/foodmate labels, project cleanup
b6dfd31 refactor: restructure project directories, add assembly_type filter, solvent column, workbench delete
75d9d2d fix: simplify delete flow — single click to warning dialog
19f1d59 feat: rename Upload page to 管理 (Manage), add admin panel with delete function
18b174e SUPRA v1.0 — Supramolecular Universal Platform for Research on Assemblies
```

共 **22 次提交**，从基线到 V1.0.0。

---

## 服务器部署信息

| 项目 | 值 |
|------|-----|
| 服务器 IP | `47.84.101.94` |
| 操作系统 | Ubuntu 24.04 |
| 项目路径 | `/opt/sad` |
| SSH 用户 | `root` |
| 部署方式 | `git pull` + `npm run build` + `docker compose restart` |

---

---

### 阶段五：后台管理系统与访问统计

**背景：** 需要了解网站访问情况（谁在访问、什么时候、看了什么），以及分子的关注度。

**新增功能：**

| 功能 | 说明 |
|------|------|
| 管理员认证 | JWT 认证，密码 `Houtai!`，24h 有效期，Bad 隐藏入口 `/admin` |
| 访客追踪中间件 | 每次 API 请求自动记录 IP、路径、UA、Referer、时间到 `visit_logs` 表 |
| 分子查看计数 | `assemblies` 表新增 `view_count`，每次打开详情页 +1 |
| 管理端 Dashboard | 6 统计卡片 + 7 天趋势柱状图 + Top Molecules 排行 + 最近访问分页 |
| CSV 导出 | 访问日志 CSV、分子统计 CSV（带认证下载）|

**后端新增文件：**
- `backend/auth.py` — JWT 创建/验证，密码校验，`require_admin` 依赖注入

**后端变更：**
| 文件 | 变更 |
|------|------|
| `models.py` | 新增 `VisitLog` 模型；`Assembly` 加 `view_count` 字段 |
| `schemas.py` | 新增 `LoginRequest`, `TokenResponse`, `VisitLogOut`, `VisitListResult`, `AdminStats`, `TopMolecule` |
| `crud.py` | 新增 `increment_view_count`, `log_visit`, `get_visits`, `get_admin_stats`, `get_top_molecules`, `export_visits_csv`, `export_molecule_stats_csv` |
| `main.py` | 新增 `visit_log_middleware`（自动记录请求）；6 个 admin 路由（login/stats/visits/top-molecules/export-visits/export-molecule-stats）；详情接口自动 +1 计数；启动时迁移旧表添加 `view_count` 列 |
| `requirements.txt` | 新增 `pyjwt==2.8.0` |

**前端新增文件：**
- `frontend/src/pages/AdminPage.tsx` — 登录表单 + 完整 Dashboard 页面

**前端变更：**
| 文件 | 变更 |
|------|------|
| `App.tsx` | 新增 `/admin` 路由（lazy load，导航栏隐藏）|
| `api/client.ts` | 新增 `adminLogin`, `getAdminStats`, `getAdminVisits`, `getTopMolecules`, `downloadExportVisits`, `downloadExportMoleculeStats` 等 7 个管理 API 函数 |
| `types/index.ts` | 新增 `VisitLog`, `VisitListResult`, `AdminStats`, `TopMolecule` 类型；`AssemblyDetail` 加 `view_count` |
| `DetailPage.tsx` | 详情页标题下方显示 "Viewed X times" |

**关键提交：** 本提交

---

## 已知限制

1. **跨境延迟：** 中国到新加坡约 300ms RTT，冷连接 TTFB 最低 1.5-2s
2. **单服务器：** 无负载均衡、无冗余
3. **HTTPS：** 目前仅 HTTP，建议后续配置 SSL
4. **前端认证：** 管理密码硬编码在 JS 中（低安全需求场景可接受）
5. **数据库备份：** 需手动操作，无自动化
6. **SQLite ALTER TABLE 局限：** `create_all` 不修改已有表，新增字段需手动 `ALTER TABLE`（已通过启动迁移处理 `view_count`）
