import { createHmac } from "node:crypto";

function notify() {
    function getWebhookUrl() {
        console.log(process.env.DINGTALK_TOKEN);
        console.log(process.env.DINGTALK_SECRET);
        const accessToken = process.env.DINGTALK_TOKEN; // access_token
        const secret = process.env.DINGTALK_SECRET; // secret
        let webhookUrl = `https://oapi.dingtalk.com/robot/send?access_token=${accessToken}`;
        if (secret) {
            const timestamp = Date.now();
            const stringToSign = `${timestamp}\n${secret}`;
            const hmac = createHmac('sha256', secret);
            hmac.update(stringToSign);
            const sign = encodeURIComponent(hmac.digest('base64'));
            webhookUrl += `&timestamp=${timestamp}&sign=${sign}`;
        }
        return webhookUrl;
    }

    async function run() {
        try {
            const priceList = await getPrice();
            let text = '';
            priceList.forEach((item) => {
                text += `${item.key}: ${item.value}\n\n`;
            });
            const webhookUrl = getWebhookUrl();
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    msgtype: 'markdown',
                    markdown: {
                        title: priceList[0].value,
                        text,
                    },
                }),
            });
            const data = await res.json();
            console.log(data)
            console.log('发送成功');
        } catch (error) {
            console.error('发送失败：', error);
        }
    }

    async function getPrice() {
        const url = `https://api.jijinhao.com/sQuoteCenter/realTime.htm?code=JO_92233&isCalc=true&_=${Date.now()}`;
        const res = await fetch(url, {
            headers: {
                accept: '*/*',
                'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8',
                'cache-control': 'no-cache',
                pragma: 'no-cache',
                'sec-fetch-dest': 'script',
                'sec-fetch-mode': 'no-cors',
                'sec-fetch-site': 'cross-site',
                'sec-fetch-storage-access': 'active',
                Referer: 'https://m.cngold.org/',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
            },
            body: null,
            method: 'GET',
        });
        const data = await res.text();
        const result = data
            .replace(/^var hq_str\s*=\s*"/, '')
            .replace(/";\s*$/, '');
        const arr = result.split(',');
        console.log(arr);
        const priceList = [
            {
                key: '实时',
                value: arr[3],
            },
            {
                key: '涨跌',
                value: arr[34],
            },
            {
                key: '涨幅',
                value: arr[35],
            },
            {
                key: '最高',
                value: arr[4],
            },
            {
                key: '最低',
                value: arr[5],
            },
            {
                key: '日期',
                value: arr[40],
            },
            {
                key: '来源',
                value: "github action next",
            }
        ];

        priceList.forEach((item) => {
            if (!(['日期', '来源'].includes(item.key))) {
                item.value =
                    Number(item.value).toFixed(2) + (item.key === '涨幅' ? '%' : '');
            }
        });
        return priceList;
    }
    void run();
}

notify();