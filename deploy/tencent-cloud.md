# 腾讯云部署说明

推荐使用腾讯云轻量应用服务器部署本项目。项目是 Next.js 全栈应用，包含 `/api/generate-storyboard` 接口，因此不要按纯静态网站上传。

## 1. 购买服务器

- 产品：轻量应用服务器或云服务器 CVM
- 地域：面向中国境内用户请选择中国大陆地域，例如广州、上海、北京、南京、成都等
- 镜像：Ubuntu 22.04 LTS
- 配置：1 核 2G 可跑，小流量建议 2 核 2G 起
- 安全组/防火墙：先放通 22、80、443；测试阶段可临时放通 3000

## 2. 安装 Docker

登录服务器后执行：

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

## 3. 上传或拉取代码

如果代码在 GitHub：

```bash
git clone https://github.com/qiukuiyue/qiukuiye.git
cd qiukuiye
```

如果你直接上传本地目录，进入项目根目录即可。

## 4. 启动服务

```bash
docker compose up -d --build
docker compose logs -f
```

测试访问：

```text
http://服务器公网IP:3000
```

确认可访问后，生产环境建议用 Nginx 反向代理到 80/443。

## 5. 配置域名解析

在腾讯云 DNSPod 添加 A 记录：

```text
主机记录：@
记录类型：A
记录值：服务器公网 IP
```

如果需要 `www`：

```text
主机记录：www
记录类型：A
记录值：服务器公网 IP
```

## 6. 配置 Nginx

安装 Nginx：

```bash
sudo apt install -y nginx
```

复制 `deploy/nginx.conf.example` 到：

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/prompt-director
sudo ln -s /etc/nginx/sites-available/prompt-director /etc/nginx/sites-enabled/prompt-director
```

编辑配置里的 `example.com www.example.com` 为你的域名：

```bash
sudo nano /etc/nginx/sites-available/prompt-director
sudo nginx -t
sudo systemctl reload nginx
```

## 7. ICP 备案与 HTTPS

中国大陆服务器绑定域名对外提供网站服务，需要在腾讯云完成 ICP 备案。备案通过后，再将备案号放到网站首页底部，并继续做公安联网备案。

HTTPS 可以使用腾讯云免费 SSL 证书，下载 Nginx 证书文件后配置到服务器；也可以使用 Certbot 自动申请证书。

## 常用维护命令

```bash
docker compose ps
docker compose logs -f
docker compose restart
docker compose down
docker compose up -d --build
```
