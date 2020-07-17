import { BaseTranslate, ITranslateOptions } from './Translate';
import request from '../util/request-promise';
const querystring = require('querystring');

export class YoudaoTranslate extends BaseTranslate {
    private _requestErrorTime: number = 0;
    async _request(content: string, { from = 'auto', to = 'auto' }: ITranslateOptions): Promise<string> {
        let url = 'http://fanyi.youdao.com/translate';
        from=to
        let data: any = {
            doctype: 'json',
            type: 'AUTO',
            i: content
        };
        url = url + '?' + querystring.stringify(data);
        let res = await request(url, {
            json: true, timeout: 10000, headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36'
            }
        });
        
        
        let sentences = res.translateResult;
        if (!sentences || !(sentences instanceof Array)) {
            return '';
        }
        let result = sentences
            .map(([trans]) => {
                if (trans) {
                    return trans.tgt
                }
            })
            .join('\n');
        console.log("res",result);
        return result;
    }

    link(content: string, { to = 'auto' }: ITranslateOptions): string {
        // [fix] 参数变化zh-cn -> zh-CN。
        let [first, last] = to.split('-');
        if (last) {
            last = last.toLocaleUpperCase();
            to = `${first}-${last}`;
        }
        let str = `https://translate.google.cn/#view=home&op=translate&sl=auto&tl=${to}&text=${encodeURIComponent(content)}`;
        return `[Google](${encodeURI(str)})`;
        // return `<a href="${encodeURI(str)}">Google</a>`;
    }

    async _translate(content: string, opts: ITranslateOptions): Promise<string> {
        let result = '';
        // 上一次失败的时间间隔小于5分钟，直接返回空
        if (Date.now() - this._requestErrorTime <= 5 * 60 * 1000) {
            return result;
        }
        try {
            result = await this._request(content, opts);
            this._onTranslate.fire(
                `[Google Translate]:\n${content}\n[<============================>]:\n${result}\n`
            );
        } catch (e) {
            this._requestErrorTime = Date.now();
            this._onTranslate.fire(
                `[Google Translate]: request error\n ${JSON.stringify(e)} \n Try again in 5 minutes.`
            );
        }
        console.log("result",result);
        return result;
    }
}
