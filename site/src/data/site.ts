export const profile = {
  name: '刘晓东',
  role: '运维开发工程师 · 自动化 / AIOps',
  email: '1105185454@qq.com',
  platform: 'https://ops.liuxd.dev',
  resumePdf: '/resume/liuxiaodong-resume.pdf',
  location: '山东滨州',
  cities: ['济南', '可远程'],
};

export const stats = [
  { n: 11, unit: '年', label: '企业 IT 运维经验' },
  { n: 16, unit: '个', label: '运维自动化实战项目' },
  { n: 500, unit: '人', label: '规模企业的 IT 独立负责' },
  { n: 210, unit: '张', label: '过程截图与踩坑记录' },
];

/** level: 熟悉 = 长期在用；掌握 = 实验中完整做过并能讲清原理；实践 = 搭建并跑通过 */
export const skills: { area: string; items: string; level: '熟悉' | '掌握' | '实践' }[] = [
  { area: 'Linux 系统', items: 'Ubuntu 初始化与安全加固 · systemd · SSH · ufw · 日志排障', level: '熟悉' },
  { area: '企业 IT', items: 'VMware 虚拟化 · 用友 ERP · Oracle 数据导入 · 终端与网络', level: '熟悉' },
  { area: '脚本开发', items: 'Python（requests · paramiko · argparse）· Shell · cron', level: '熟悉' },
  { area: '中间件', items: 'Nginx 负载均衡 · MySQL 主从与时间点恢复 · Redis', level: '掌握' },
  { area: '配置管理', items: 'Ansible playbook / role · Jinja2 模板 · Vault', level: '掌握' },
  { area: '容器', items: 'Docker · 多阶段构建 · Docker Compose', level: '掌握' },
  { area: '监控告警', items: 'Prometheus · PromQL · Grafana · Alertmanager', level: '掌握' },
  { area: '容器编排', items: 'kubeadm · Kubernetes 核心对象 · Helm · Loki', level: '实践' },
  { area: '持续交付', items: 'Jenkins Pipeline · GitHub Actions · Argo CD', level: '实践' },
  { area: '高可用 / IaC', items: 'Keepalived · Terraform', level: '实践' },
];

export const journey = [
  {
    time: '2013 – 2024',
    title: '山东汇金彩钢 · 信息技术员',
    text: '约 500 人制造企业。维护 3 台物理服务器上的 VMware 虚拟化平台、约 100 台终端和办公网络；用 Python 实现 ERP 物料清单批量创建和话费自动统计。',
  },
  {
    time: '2024 – 2026',
    title: '灵活就业 · 学习数据分析',
    text: '工作之余学习数据分析，2026 年取得 IBM Data Analyst 专业证书。',
  },
  {
    time: '2026.09 – 10',
    title: '运维自动化 · 16 个实战项目',
    text: '在自己搭建的虚拟机集群上，从 Linux 初始化一路做到 Kubernetes GitOps 发布与回滚。',
  },
  {
    time: '2026.10 – 至今',
    title: '线上运维平台 ops.liuxd.dev',
    text: '在云服务器上用 k3s + Argo CD 自建并长期运行：自动发布、监控告警、证书续期和异地备份全部自动化。',
  },
  {
    time: 'NOW',
    title: '寻找运维自动化岗位',
    text: '济南、淄博、滨州及山东省内，可随时到岗。',
    now: true,
  },
];
