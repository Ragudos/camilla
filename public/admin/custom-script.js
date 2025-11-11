function renderBlog() {
  return h("main", {});
}

const BlogPreview = createClass({
  render: renderBlog,
});

CMS.registerPreviewTemplate("blog", BlogPreview);
CMS.registerPreviewStyle("/admin/preview.css");
