export interface Lane {
  label: string;
  nodes: { name: string; sub?: string; accent?: boolean }[];
}

export interface Case {
  slug: string;
  no: string;
  tag: string;
  title: string;
  summary: string;
  chips: string[];
  stack: string[];
  env: string;
  background: string[];
  lanes: Lane[];
  steps: { title: string; text: string }[];
  issues: { symptom: string; cause: string; fix: string }[];
  results: string[];
  links?: { label: string; href: string }[];
}

const ENV = '笔记本 VirtualBox + Vagrant，3–4 台 Ubuntu 22.04 虚拟机';

export const cases: Case[] = [
  {
    slug: 'gitops-pipeline',
    no: '01',
    tag: 'CI/CD · GitOps',
    title: 'GitOps 持续交付流水线',
    summary: '代码合并后自动测试、构建、发布到 Kubernetes。坏版本被就绪探针拦住，旧版本持续服务，一次 git revert 就能回滚。',
    chips: ['GitHub Actions', 'Jenkins', 'Registry', 'Argo CD', 'Kubernetes'],
    stack: ['GitHub Actions', 'Jenkins Pipeline', 'Docker', '私有 Registry', 'Argo CD', 'Kubernetes', 'Go'],
    env: ENV,
    background: [
      '一个 Go 编写的 Web 应用，原来靠手工 docker build 和 kubectl apply 发布：步骤多、容易漏，出了问题也说不清线上跑的到底是哪个版本。',
      '目标：每次发布都能追溯到具体的代码提交；发布失败不影响用户；回滚不靠登录服务器，而是一个可审计的操作。',
    ],
    lanes: [
      { label: '代码检查', nodes: [{ name: '提交 PR' }, { name: 'GitHub Actions', sub: 'go vet · go test' }, { name: '合并 main', sub: '分支保护' }] },
      { label: '构建', nodes: [{ name: 'Jenkins Pipeline', sub: '轮询代码仓库' }, { name: 'docker build', sub: '构建时再跑测试' }, { name: '私有 Registry', sub: 'tag：构建号-提交号', accent: true }] },
      { label: '部署', nodes: [{ name: '更新 GitOps 仓库', sub: '只改镜像 tag' }, { name: 'Argo CD', sub: 'auto-sync · selfHeal' }, { name: 'Kubernetes', sub: '滚动更新', accent: true }] },
    ],
    steps: [
      { title: '代码与部署配置分仓', text: '应用代码放在 labapp，"线上应该是什么样"放在 labapp-gitops。部署历史就是 Git 历史，谁在什么时候改了什么一目了然。' },
      { title: 'PR 阶段自动检查', text: 'GitHub Actions 在 PR 上跑 go vet 和单元测试，配合分支保护，检查不过不能合并。为了能测，先把路由抽成独立函数并补上测试。' },
      { title: 'Jenkins 构建并推送镜像', text: '自建带 Docker CLI 的 Jenkins 镜像；镜像 tag 采用"构建号-提交号 7 位"，从任意一个线上镜像都能反查到对应的代码提交。' },
      { title: '最小权限更新部署仓库', text: 'Jenkins 使用 fine-grained token，只能写 labapp-gitops 一个仓库，每次只改镜像 tag 一行；Jenkins 本身不持有集群凭据。' },
      { title: 'Argo CD 自动同步', text: '开启自动同步、prune 和 selfHeal：有人手动改了集群，也会被改回 Git 里的状态，线上与配置始终一致。' },
      { title: '坏版本演练', text: '故意发布一个监听端口写错的版本：单元测试发现不了，但就绪探针失败，新 Pod 始终不 Ready；maxUnavailable 设为 0，旧 Pod 不会被删除，服务不中断。在部署仓库 git revert 后自动恢复。' },
    ],
    issues: [
      { symptom: 'Argo CD 的 Redis 一直拉不下镜像', cause: 'chart 默认镜像来自 ECR Public，国内网络访问失败', fix: '在 values 中改用 docker.io 镜像，并固定 chart 版本' },
      { symptom: '检查失败的 PR 仍然可以合并', cause: '首次配置分支保护时检查还没运行过，没勾上；管理员默认可绕过规则', fix: '补选必需检查，并开启"不允许绕过规则"' },
      { symptom: '节点拉私有镜像时报 HTTP / HTTPS 不匹配', cause: 'containerd 的 hosts.toml 多写了 skip_verify，被当作 TLS 配置，优先走 HTTPS', fix: '删除该配置，通过 containerd 日志确认按 HTTP 拉取' },
      { symptom: '两个节点关机后，上面的 Pod 一直显示 Running', cause: '3 个节点挂了 2 个，节点控制器判定为大面积故障，小集群会停止驱逐', fix: 'cordon 故障节点并强制删除其上的 Pod，由控制器在健康节点重建' },
    ],
    results: [
      '从合并代码到新版本上线全程自动，无需登录服务器',
      '每个线上镜像都能对应到一个 Git 提交',
      '坏版本被就绪探针拦截，旧版本持续服务，用户无感知',
      '回滚就是一次 git revert，几分钟内完成且有记录可查',
    ],
    links: [
      { label: '应用代码与 Jenkinsfile', href: 'https://github.com/roccowork/labapp' },
      { label: 'GitOps 部署仓库', href: 'https://github.com/roccowork/labapp-gitops' },
    ],
  },
  {
    slug: 'k8s-observability',
    no: '02',
    tag: 'Kubernetes · 可观测性',
    title: 'Kubernetes 集群搭建与可观测性平台',
    summary: '用 kubeadm 从零部署 v1.34 三节点集群，Helm 安装 Prometheus + Loki，指标、日志、告警在 Grafana 统一查看。',
    chips: ['kubeadm', 'containerd', 'Ingress', 'Helm', 'Prometheus', 'Loki'],
    stack: ['kubeadm v1.34', 'containerd', 'Flannel', 'Ingress-nginx', 'Helm', 'kube-prometheus-stack', 'Loki', 'Alloy', 'Grafana'],
    env: ENV,
    background: [
      '云上托管的 Kubernetes 把安装细节都藏了起来，但排障时绕不开控制面、证书、容器运行时和网络插件。',
      '目标：亲手用 kubeadm 搭一个集群，把应用部署上去，再补上企业常用的指标监控和日志方案。',
    ],
    lanes: [
      { label: '集群', nodes: [{ name: '控制面', sub: 'apiserver · etcd · scheduler' }, { name: '工作节点 ×2', sub: 'kubelet · containerd' }, { name: 'Flannel', sub: '指定内网网卡' }] },
      { label: '流量', nodes: [{ name: '浏览器' }, { name: 'Ingress-nginx', sub: 'NodePort 30080' }, { name: 'Service' }, { name: 'Deployment ×3', accent: true }] },
      { label: '可观测', nodes: [{ name: 'Prometheus', sub: 'ServiceMonitor · Rule' }, { name: 'Loki', sub: 'Alloy 采集日志' }, { name: 'Grafana', sub: '统一看板', accent: true }, { name: 'Alertmanager' }] },
    ],
    steps: [
      { title: 'kubeadm 部署 1 主 2 从', text: 'containerd 作为容器运行时；通过 hosts.toml 为 registry.k8s.io、docker.io、quay.io 配置国内镜像加速，不改 kubeadm 默认镜像地址。' },
      { title: '解决双网卡选错 IP', text: '每台虚拟机都有一块 IP 相同的 NAT 网卡，kubelet 和 Flannel 默认会选中它。显式设置 kubelet node-ip、apiserver 通告地址和 Flannel 网卡后，节点互通正常。' },
      { title: '部署应用并验证核心能力', text: '用 Deployment、Service、Ingress、ConfigMap 部署应用，逐项验证自愈、扩缩容、滚动更新与回滚；用 local PV + PVC 做数据持久化。' },
      { title: 'Helm 管理监控栈', text: '安装 kube-prometheus-stack 并固定 chart 版本，所有改动写在 values 文件中，用 helm upgrade / rollback 管理变更。' },
      { title: '集中日志', text: '部署 Loki + Alloy 收集所有 Pod 日志（Promtail 已停止维护，因此选用 Alloy），在 Grafana 中按命名空间检索。' },
      { title: '自定义告警与采集', text: '编写 PrometheusRule，在应用副本数不足时告警；为 ingress-nginx 补充 metrics Service 和 ServiceMonitor，采集请求指标。' },
    ],
    issues: [
      { symptom: 'Grafana 页面返回 503', cause: '内存限制 384Mi 不够，容器反复重启', fix: '调整为 requests 256Mi / limits 640Mi' },
      { symptom: 'chart 自带的 node-exporter 启动失败', cause: '主机上已有 node-exporter 占用 9100 端口', fix: '在 values 中改用 9101' },
      { symptom: 'Grafana 中看不到 Ingress 请求指标', cause: 'ingress-nginx v1.14 默认关闭 metrics', fix: '开启 --enable-metrics，并创建 metrics Service 与 ServiceMonitor' },
      { symptom: 'etcd、scheduler 等采集目标全部报错', cause: 'kubeadm 将这些组件绑定在 127.0.0.1，集群内无法访问', fix: '关闭这几项采集，避免长期误报' },
    ],
    results: [
      '从零搭起可用的三节点集群，并能讲清每一步的作用',
      '应用通过域名访问，自愈、扩缩容、滚动更新均已验证',
      '指标、日志、告警在 Grafana 中统一查看',
      '监控栈配置全部版本化，变更可回滚',
    ],
  },
  {
    slug: 'automation-toolkit',
    no: '03',
    tag: 'Automation · Containers',
    title: '运维自动化与容器化',
    summary: '用 Shell、Ansible、Python、Docker、Terraform 把重复工作写成代码：新机器一条命令交付，每天自动出巡检报告。',
    chips: ['Shell', 'Ansible', 'Python', 'Docker', 'Terraform'],
    stack: ['Shell', 'cron', 'Ansible', 'Jinja2', 'Ansible Vault', 'Python', 'paramiko', 'Docker', 'Docker Compose', 'Terraform'],
    env: ENV,
    background: [
      '人工逐台登录、改配置、查状态，既慢又容易不一致；一台机器配错了，往往要到出故障时才发现。',
      '目标：把日常重复工作沉淀成代码，并且保证重复执行是安全的——跑一次和跑十次结果一样。',
    ],
    lanes: [
      { label: '交付', nodes: [{ name: 'Ansible roles', sub: 'baseline · web · redis' }, { name: '新服务器', sub: '账号 · SSH 加固 · 防火墙 · Nginx · Redis' }, { name: '重复执行', sub: 'changed=0', accent: true }] },
      { label: '巡检', nodes: [{ name: 'cron', sub: '每天 09:00' }, { name: 'Python 巡检', sub: '调用 Prometheus API' }, { name: 'Alertmanager', sub: '推送通知', accent: true }] },
      { label: '容器', nodes: [{ name: '多阶段构建', sub: '约 300MB → 15MB' }, { name: 'Compose', sub: 'Nginx · Go · MySQL · Redis' }, { name: 'Terraform', sub: 'Docker provider', accent: true }] },
    ],
    steps: [
      { title: 'Shell 巡检与备份', text: '巡检脚本通过 SSH 批量检查磁盘、内存、负载、关键服务和 MySQL 主从状态，按阈值输出告警，用退出码对接其他自动化。备份脚本带校验和保留策略，用 pipefail 防止"备份失败却留下空文件"。' },
      { title: 'Ansible role 交付新机器', text: '把系统初始化、Nginx、Redis 封装成三个 role，使用 Jinja2 模板和分层变量，密码用 Vault 加密；先 --check --diff 预演，再正式执行。' },
      { title: 'Python 运维工具', text: '调用 Prometheus HTTP API 生成多主机巡检报告，异常推送到 Alertmanager；用 paramiko + 线程池并发执行命令，单台失败不影响整体；venv + requirements.txt 管理依赖。' },
      { title: 'Docker 镜像与编排', text: '多阶段构建、非 root 运行、带健康检查。Compose 用健康检查控制启动顺序，前端 / 后端两个网络隔离数据库，通过 MySQL 参数和容器内存上限在 1GB 内存的主机上稳定运行。' },
      { title: 'Terraform 管理容器', text: '用 Docker provider 通过 SSH 管理远端容器，完整练习 plan / apply / destroy、扩容、修改配置和漂移检测。' },
    ],
    issues: [
      { symptom: 'Terraform 每次 plan 都显示有差异', cause: 'memory_swap、log_opts 没在代码里写明，实际值来自 Docker 的 daemon.json', fix: '把实际值写进代码，plan 不再有变化' },
      { symptom: 'Compose 扩容后，新副本收不到请求', cause: 'Nginx 只在启动时解析一次服务名', fix: '重启 Nginx 后请求轮流分到两个副本；生产中可用 resolver 动态解析' },
      { symptom: 'Docker 映射的端口绕过了 ufw', cause: 'Docker 直接写 iptables 规则，先于 ufw 生效', fix: '端口只绑定 127.0.0.1 或内网地址' },
      { symptom: '容器里 nslookup 报 NXDOMAIN，但程序能连上数据库', cause: 'busybox 的 nslookup 会拼接宿主机的搜索域', fix: '改用 getent hosts，与程序的解析方式一致' },
    ],
    results: [
      '新服务器一条命令完成交付，重复执行 changed=0',
      '每天 9 点自动生成巡检报告，异常直接推送告警',
      '应用镜像约 300MB → 15MB，在 1GB 内存主机上稳定运行',
      '基础设施变更先 plan 再 apply，配置漂移可被发现',
    ],
  },
  {
    slug: 'ha-and-dr',
    no: '04',
    tag: 'High Availability · DR',
    title: 'Web 高可用与数据库容灾',
    summary: 'Keepalived 让 VIP 在主备之间秒级漂移；MySQL GTID 主从加时间点恢复，误删库也能找回；服务停止约 1 分钟内告警。',
    chips: ['Nginx', 'Keepalived', 'MySQL 主从', 'binlog', 'Prometheus'],
    stack: ['Nginx', 'Keepalived', 'MySQL 8.0', 'Redis', 'Prometheus', 'Alertmanager', 'Grafana', 'node_exporter'],
    env: ENV,
    background: [
      '单台 Nginx 或单个数据库出问题，业务就停；误删数据如果只有昨晚的备份，当天的数据就丢了。',
      '目标：接入层没有单点；数据库能恢复到误操作前的任意时刻；出了问题第一时间知道。',
    ],
    lanes: [
      { label: '接入', nodes: [{ name: '用户' }, { name: 'VIP', sub: 'VRRP 单播' }, { name: 'Nginx 主 / 备', sub: '健康检查脚本', accent: true }, { name: '后端 ×2' }] },
      { label: '数据', nodes: [{ name: 'MySQL 主库', sub: 'GTID · binlog' }, { name: '从库', sub: 'super_read_only' }, { name: '每日备份', sub: '校验 · 异地副本', accent: true }] },
      { label: '监控', nodes: [{ name: 'node_exporter' }, { name: 'Prometheus', sub: '告警规则' }, { name: 'Alertmanager', sub: '分组 · 抑制 · 静默', accent: true }] },
    ],
    steps: [
      { title: 'Nginx 负载均衡', text: '反向代理两台后端，upstream 轮询并在后端故障时自动切换；能根据 502、Access denied、NOAUTH 等报错定位到进程、监听地址或授权问题。' },
      { title: 'Keepalived 双机热备', text: '两台 Nginx 共用一个 VIP，单播心跳，健康检查脚本监测 Nginx 进程；Nginx 停止或主机宕机时，VIP 秒级漂移到备机。' },
      { title: '复现并分析脑裂', text: '阻断两台之间的心跳，两台同时持有 VIP，用 ARP 表观察客户端实际访问的是哪一台，理解免费 ARP 和抢占机制。' },
      { title: 'MySQL GTID 主从', text: '基于 GTID 搭建主从复制，从库开启 super_read_only；通过 SHOW REPLICA STATUS 排查 IO / SQL 线程中断。' },
      { title: '误删库时间点恢复', text: '模拟 DROP DATABASE，用"全量备份 + binlog"恢复到删库前一刻，数据不丢；备份定时执行并异地保存。' },
      { title: '监控与告警', text: 'Ansible 批量部署 node_exporter，Prometheus 采集所有主机；配置告警分组、抑制和静默，服务停止约 1 分钟内告警，并发送恢复通知。' },
    ],
    issues: [
      { symptom: '用 VIP 访问报 Connection refused，但浏览器能打开', cause: '.100 是 VirtualBox 网段自带 DHCP 服务器的地址，IP 冲突', fix: 'VIP 改为未使用的 .50；用 ip neigh 查 VIP 对应的 MAC 即可确认' },
      { symptom: '删掉防火墙放行规则后，脑裂仍未出现', cause: 'VRRP 流已被 conntrack 记为 ESTABLISHED，ufw 在用户规则之前就放行了', fix: '用 iptables 在最前面插入 DROP 规则阻断心跳' },
      { symptom: '在备份文件里找不到新语法的复制位点', cause: 'Ubuntu 22.04 的 mysqldump 仍输出旧语法 CHANGE MASTER TO', fix: '同时匹配新旧两种写法' },
      { symptom: 'Alertmanager 容器反复重启', cause: '漏建配置文件，日志报 no such file', fix: '补建配置；排查顺序：先看退出码，再看日志中的 error 行' },
    ],
    results: [
      '接入层无单点，主机宕机时 VIP 秒级切换',
      '误删库可恢复到删除前一刻',
      '服务停止约 1 分钟内收到告警，恢复后自动通知',
      '主从、备份、告警均经过实际故障演练',
    ],
  },
];
