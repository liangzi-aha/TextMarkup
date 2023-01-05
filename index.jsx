/*
 * @Author: liyongliang 17837022875@163.com
 * @Date: 2022-09-02 16:31:42
 * @LastEditors: liyongliang 17837022875@163.com
 * @LastEditTime: 2022-09-15 15:24:05
 * @FilePath: /zhongheschool-web/client/components/TextMarkup/index.jsx
 * @Description: 组件思路，选中文本获取文本内容，创建标签包裹文本展示高亮
 */

import React, { useEffect, useMemo, useState, useRef, useImperativeHandle, forwardRef } from 'react'
import cn from 'classnames'
import { observer, useStore } from '@/hooks/storeHooks'
import st from './index.scss'
import { makeAutoObservable } from 'mobx'

/**
 * 回显标记
 */
function echoTextMarkup(setTextMarkupCon, textMarkup, echoArray) {
    let textContent = textMarkup?.split('');
    // console.log(textContent);
    let text = ''; // 标记段落
    let allText = ''; // 所有文本包含标记和为标记的文本

    // 重新渲染dom
    echoArray.forEach((item, index, self) => {
        // 当前段为标记状态
        if (item) {
            text += textContent[index];
            // 最后一个段落
            if ((self.length - 1) == index) {
                allText += `<span class="${st["highlight"]}">${text}</span>`;
                // 清空当前选中段落内容
                text = '';
            }
        } else { // 不是标记状态
            // 有段落表示是上一个标记文本的结束
            if (text) {
                allText += `<span class="${st["highlight"]}">${text}</span>`;
                // 清空当前选中段落内容
                text = '';
            }
            // 拼接没有选中的文本
            allText += textContent[index];
        }
    });
    // 修改选中内容文本
    setTextMarkupCon(allText)
}

/**
 * 
 * type 1:标记 2:取消标记
 * TextMarkupBox: 标记盒子（因为标记功能是全局的，限制在改盒子中的可以进行标记）
 * setTextMarkupCon：修改标记内容
 * textMarkup: 标记的文本字符串
 * echoArray: 回显数据
 */
// 数组文本记录选中的dom状态
let textArray = [];
function highlight(type, TextMarkupBox, setTextMarkupCon) {
    // 是否支持选中 getSelection
    if (window.getSelection) {
        // 方法表示用户选择的文本范围或光标的当前位置。
        const sel = window.getSelection();
        // sel.rangeCount 没有选中文本不执行下面的内容 echoArray: 回显数组
        if (!sel.rangeCount) return;
        // 方法返回范围对象，该对象包含来自所选文本的startOffset索引和endOffset索引
        const range = sel?.getRangeAt(0);

        const {
            commonAncestorContainer, // 只读属性，返回目标节点的共有祖先节点。因而需要注意：selectNode 方法中的该值为目标节点的父节点，selectNodeContents 方法中的该值为其本身
            startContainer, // Range.startContainer 是只读属性，返回 Range 开始的节点
            endContainer, // Range.endContainer 是一个只读属性。它会返回Range对象结束的Node
            startOffset, // Range.startOffset 是一个只读属性，用于返回一个表示 Range 在 startContainer 中的起始位置的数字。
            endOffset, // 只读属性 Range.endOffset 返回代表 Range 结束位置在 Range.endContainer 中的偏移值的数字。
        } = range;

        // 是否包含某个dom（如果在 TextMarkupBox 中选中的dom进行高亮显示）
        if (!TextMarkupBox.current.contains(commonAncestorContainer)) return;

        // console.log(sel?.toString());
        // console.group("range");
        // console.log("rage", range);
        // console.log("commonAncestorContainer", commonAncestorContainer, commonAncestorContainer.data);
        // console.log("startContainer", startContainer);
        // console.log("endContainer", endContainer);
        // console.log("startOffset", startOffset);
        // console.log("endOffset", endOffset);
        // console.log("startContainer.parentNode", startContainer.parentNode);
        // console.groupEnd();

        // 文本内容
        let textContent = commonAncestorContainer?.data?.split('');
        // 文本length
        let textLength = commonAncestorContainer.length;
        let allText = ''; // 所有文本包含标记和为标记的文本
        let text = ''; // 标记段落

        // 数组文本记录选中的dom状态
        if (textArray.length == 0) {
            textArray = new Array(textLength).fill(false);
        }

        // startOffset：选择文本开始下标 endOffset：选择文本结束下标
        for (var i = startOffset; i < endOffset; i++) {
            textArray[i] = (type == 1 ? true : false);
        }

        // 重新渲染dom
        textArray.forEach((item, index, self) => {
            // 当前段为标记状态
            if (item) {
                text += textContent[index];
                // 最后一个段落
                if ((self.length - 1) == index) {
                    allText += `<span class="${st["highlight"]}">${text}</span>`;
                    // 清空当前选中段落内容
                    text = '';
                }
            } else { // 不是标记状态
                // 有段落表示是上一个标记文本的结束
                if (text) {
                    allText += `<span class="${st["highlight"]}">${text}</span>`;
                    // 清空当前选中段落内容
                    text = '';
                }
                // 拼接没有选中的文本
                allText += textContent[index];
            }
        });
        // 修改选中内容文本
        setTextMarkupCon(allText)
        // console.log(allText);

        // 失去焦点
        try {
            sel?.removeRange && sel?.removeRange(range);
            // qq 浏览器删除Range方法不一样
            sel?.removeAllRanges && sel?.removeAllRanges();
        } catch (error) {
            console.log(sel);
            // console.error(error)
        }

    } else {
        alert('您的浏览器不支持标记功能');
    }
}

/**
 * className: 样式
 * textMarkup: 复制的文本内容
 * echoArray: 回显数组
 */
export default forwardRef(function TextMarkup({ className, textMarkup, echoArray, ...props }, ref) {
    // 标记标签box，包含在改标签的内容进行标记
    let TextMarkupBox = useRef()
    // 文本标记内容
    let [TextMarkupCon, setTextMarkupCon] = useState('');
    // 回显
    useEffect(() => {
        // 组件每次重新渲染，清空历史数据
        textArray = [];
        if(echoArray && echoArray.length > 0){
            textArray = echoArray;
            echoTextMarkup(setTextMarkupCon, textMarkup, echoArray)
        }
    }, []);

    // 可以让你在使用 ref 时自定义暴露给父组件的实例值。在大多数情况下，应当避免使用 ref 这样的命令式代码。useImperativeHandle 应当与 forwardRef 一起使用。
    useImperativeHandle(ref, () => ({
        // 外部调用此方法直接显示错误 如果传入参数 则按参数显示错误信息
        setHighlight: () => {
            highlight(1, TextMarkupBox, setTextMarkupCon, textMarkup)
        },
        cancelHighlight: () => {
            highlight(2, TextMarkupBox, setTextMarkupCon, textMarkup)
        },
        // 获取标记文本字符串
        getSelectText: () => {
            const sel = window.getSelection();
            console.log(sel);
            // if (!sel.rangeCount) return '';
            console.log(sel?.toString());
            return sel?.toString();
        },
        // 获取标记数组（用于回显）
        getSelectList: () => {
            return textArray;
        }
    }))

    return <div ref={TextMarkupBox} className={cn(st['text-markup-box'], className)} {...props}>
        {/* 复制一份children 用于修改dom操作，不去修改原有的dom */}
        <div className={st['text-markup']} dangerouslySetInnerHTML={{ __html: TextMarkupCon }}></div>
        {/* 原本的children用于选择 */}
        <div className={st['children']} dangerouslySetInnerHTML={{ __html: textMarkup }}></div>
    </div>
})