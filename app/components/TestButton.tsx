"use client";

import { saveArticleAuto } from "../admin/actions";

export default function TestButton() {
  return (
    <button className="btn btn-primary btn-sm " onClick={saveArticleAuto}>
      Test creation auto
    </button>
  );
}
