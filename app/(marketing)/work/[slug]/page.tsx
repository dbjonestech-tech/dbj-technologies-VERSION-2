import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug, getProjectSlugs } from "@/lib/work-data";
import { SITE } from "@/lib/constants";
import { ProjectDetailLayout } from "@/components/templates/ProjectDetailLayout";
import { JsonLd } from "@/components/layout/JsonLd";

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: project.name,
    description: project.heroDescription,
    alternates: { canonical: `${SITE.url}/work/${slug}` },
    openGraph: {
      title: `${project.name} | DBJ Technologies`,
      description: project.heroDescription,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <JsonLd
        type="creativeWork"
        creativeWork={{
          slug: project.slug,
          name: project.name,
          description: project.description,
          image: project.image,
          category: project.category,
        }}
      />
      <JsonLd
        type="breadcrumb"
        breadcrumb={[
          { name: "Home", url: SITE.url },
          { name: "Work", url: `${SITE.url}/work` },
          { name: project.name, url: `${SITE.url}/work/${slug}` },
        ]}
      />
      <ProjectDetailLayout project={project} />
    </>
  );
}
