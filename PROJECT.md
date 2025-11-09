这是一个nextjs+Mastra的初始化项目最终会部署到Cloudfare Workers。

项目概述:

- 用户进入页面后通过拖拽、上传的方式上传图片

- Mastra Agent介入处理
    - Mastra通过tool把图片进行压缩
    - Mastra通过tool把压缩后的图片上传到Cloudfare R2
    - Mastra通过tool对图片进行分析，生成图片描述
    - Mastra返回对图片的描述以及上传Cloudfare R2 后的图片地址

- 用户在页面上可以看到处理好后的图片描述，以及一个图片地址(地址后跟一个复制按钮)


部署方式:

该项目会部署到Cloudfare Workers上，要符合部署规范